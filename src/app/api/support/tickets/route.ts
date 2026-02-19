import { getServerSession } from 'next-auth/next';

import { sendSupportTicketEmail } from '../../../../infra/email/sendSupportTicketEmail';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { createSupportTicketSchema } from '../../../../lib/api/support/validation';
import { authOptions } from '../../../../lib/auth/nextauth';
import { prisma } from '../../../../lib/db/prisma';
import { getClientIp } from '../../../../lib/http/rateLimit';
import { withApiLogging } from '../../../../lib/observability/apiLogger';
import { logWarn, serializeError } from '../../../../lib/observability/logger';
import { isSupportCaptchaConfigured, verifySupportCaptcha } from '../../../../lib/support/captcha';
import { hashSupportEmailAddress, hashSupportIpAddress } from '../../../../lib/support/ipHash';
import { shouldRequireSupportCaptcha } from '../../../../lib/support/policy';
import { computeSupportRetentionExpiresAt } from '../../../../lib/support/retention';
import type { SupportAbuseSignalType } from '../../../../lib/support/types';

export const runtime = 'nodejs';

type CreateSupportTicketResponse = {
  accepted: true;
};

const CAPTCHA_ATTEMPTS_WINDOW_MS = 60 * 60 * 1000;
const CAPTCHA_HONEYPOT_WINDOW_MS = 24 * 60 * 60 * 1000;
const IP_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const IP_LIMIT_MAX = 5;
const EMAIL_LIMIT_MAX = 3;

async function persistAbuseSignals(args: {
  signalTypes: SupportAbuseSignalType[];
  ipHash: string;
  emailHash: string | null;
  userAgent: string | null;
  ticketId?: string | null;
  now: Date;
}) {
  if (args.signalTypes.length === 0) {
    return;
  }

  await prisma.supportAbuseSignal.createMany({
    data: args.signalTypes.map((signalType) => ({
      ticketId: args.ticketId ?? null,
      signalType,
      ipHash: args.ipHash,
      emailHash: args.emailHash,
      userAgent: args.userAgent,
      createdAt: args.now,
    })),
  });
}

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/support/tickets' },
    async () => {
      const session = await getServerSession(authOptions);

      const body = await request.json();
      const parsed = createSupportTicketSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid support request payload.', 400);
      }

      const now = new Date();
      const ipAddress = getClientIp(request);
      const ipHash = hashSupportIpAddress(ipAddress);
      const emailHash = hashSupportEmailAddress(parsed.data.email);
      const userAgent = request.headers.get('user-agent')?.trim().slice(0, 512) ?? null;

      // Keep honeypot handling indistinguishable from successful submissions.
      if (parsed.data.honeypot.trim().length > 0) {
        await persistAbuseSignals({
          signalTypes: ['submission_attempt', 'honeypot_hit'],
          ipHash,
          emailHash,
          userAgent,
          now,
        });

        return jsonOk<CreateSupportTicketResponse>({ accepted: true });
      }

      const [attemptsLastHour, honeypotHitsLastDay] = await Promise.all([
        prisma.supportAbuseSignal.count({
          where: {
            ipHash,
            signalType: 'submission_attempt',
            createdAt: { gte: new Date(now.getTime() - CAPTCHA_ATTEMPTS_WINDOW_MS) },
          },
        }),
        prisma.supportAbuseSignal.count({
          where: {
            ipHash,
            signalType: 'honeypot_hit',
            createdAt: { gte: new Date(now.getTime() - CAPTCHA_HONEYPOT_WINDOW_MS) },
          },
        }),
      ]);

      const captchaRequired = shouldRequireSupportCaptcha({
        attemptsLastHour: attemptsLastHour + 1,
        honeypotHitsLastDay,
      });

      if (captchaRequired) {
        if (!isSupportCaptchaConfigured()) {
          await persistAbuseSignals({
            signalTypes: ['submission_attempt', 'captcha_required', 'rate_limited'],
            ipHash,
            emailHash,
            userAgent,
            now,
          });
          throw new ApiError('rate_limited', 'Too many requests. Try again later.', 429);
        }

        const captchaToken = parsed.data.captchaToken ?? '';
        if (!captchaToken) {
          await persistAbuseSignals({
            signalTypes: ['submission_attempt', 'captcha_required', 'captcha_failed'],
            ipHash,
            emailHash,
            userAgent,
            now,
          });
          throw new ApiError('forbidden', 'Captcha verification is required.', 403);
        }

        const captchaResult = await verifySupportCaptcha({ token: captchaToken, ipAddress });
        if (!captchaResult.ok) {
          await persistAbuseSignals({
            signalTypes: ['submission_attempt', 'captcha_required', 'captcha_failed'],
            ipHash,
            emailHash,
            userAgent,
            now,
          });
          throw new ApiError('forbidden', 'Captcha verification failed.', 403);
        }
      }

      const [ipSubmissionCount, emailSubmissionCount] = await Promise.all([
        prisma.supportTicket.count({
          where: {
            ipHash,
            createdAt: { gte: new Date(now.getTime() - IP_LIMIT_WINDOW_MS) },
          },
        }),
        prisma.supportTicket.count({
          where: {
            emailHash,
            createdAt: { gte: new Date(now.getTime() - EMAIL_LIMIT_WINDOW_MS) },
          },
        }),
      ]);

      if (ipSubmissionCount >= IP_LIMIT_MAX || emailSubmissionCount >= EMAIL_LIMIT_MAX) {
        await persistAbuseSignals({
          signalTypes: ['submission_attempt', 'rate_limited'],
          ipHash,
          emailHash,
          userAgent,
          now,
        });
        throw new ApiError('rate_limited', 'Too many requests. Try again later.', 429);
      }

      const retentionExpiresAt = computeSupportRetentionExpiresAt(now);
      const ticket = await prisma.$transaction(async (tx) => {
        const createdTicket = await tx.supportTicket.create({
          data: {
            userId: session?.user?.id ?? null,
            category: parsed.data.category,
            status: 'open',
            name: parsed.data.name,
            email: parsed.data.email,
            emailHash,
            subject: parsed.data.subject,
            message: parsed.data.message,
            ipHash,
            userAgent,
            retentionExpiresAt,
            legalHoldUntil: null,
            createdAt: now,
            updatedAt: now,
          },
          select: { id: true },
        });

        await tx.supportAbuseSignal.createMany({
          data: [
            {
              ticketId: createdTicket.id,
              signalType: 'submission_attempt',
              ipHash,
              emailHash,
              userAgent,
              createdAt: now,
            },
            ...(captchaRequired
              ? [
                  {
                    ticketId: createdTicket.id,
                    signalType: 'captcha_required' as const,
                    ipHash,
                    emailHash,
                    userAgent,
                    createdAt: now,
                  },
                ]
              : []),
          ],
        });

        return createdTicket;
      });

      if (!ticket.id) {
        throw new ApiError('internal_error', 'Unable to create support ticket.', 500);
      }

      try {
        await sendSupportTicketEmail({
          ticketId: ticket.id,
          category: parsed.data.category,
          name: parsed.data.name,
          email: parsed.data.email,
          subject: parsed.data.subject,
          message: parsed.data.message,
          createdAt: now,
        });
      } catch (error) {
        logWarn('support.email.send_failed', {
          ticketId: ticket.id,
          category: parsed.data.category,
          ...serializeError(error),
        });
      }

      return jsonOk<CreateSupportTicketResponse>({ accepted: true });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
