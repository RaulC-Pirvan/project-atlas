import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { updateReminderSettingsSchema } from '../../../../lib/api/reminders/validation';
import { authOptions } from '../../../../lib/auth/nextauth';
import { prisma } from '../../../../lib/db/prisma';
import {
  applyRateLimitHeaders,
  consumeRateLimit,
} from '../../../../lib/http/rateLimit';
import { withApiLogging } from '../../../../lib/observability/apiLogger';
import {
  getReminderRateLimitKey,
  REMINDER_SETTINGS_RATE_LIMIT,
} from '../../../../lib/reminders/rateLimit';
import { resolveReminderSettings } from '../../../../lib/reminders/settings';
import { getReminderSettingsValidationError } from '../../../../lib/reminders/validation';

export const runtime = 'nodejs';

type ReminderSettingsResponse = {
  settings: ReturnType<typeof resolveReminderSettings>;
};

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/reminders/settings' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const decision = consumeRateLimit(
        getReminderRateLimitKey(session.user.id, 'settings:get'),
        REMINDER_SETTINGS_RATE_LIMIT,
      );
      if (decision.limited) {
        const response = jsonError(
          new ApiError('rate_limited', 'Too many requests. Try again later.', 429, 'retry_later'),
        );
        applyRateLimitHeaders(response.headers, decision);
        return response;
      }

      const settingsRecord = await prisma.userReminderSettings.findUnique({
        where: { userId: session.user.id },
        select: {
          dailyDigestEnabled: true,
          dailyDigestTimeMinutes: true,
          quietHoursEnabled: true,
          quietHoursStartMinutes: true,
          quietHoursEndMinutes: true,
          snoozeDefaultMinutes: true,
        },
      });

      const settings = resolveReminderSettings(settingsRecord);

      return jsonOk<ReminderSettingsResponse>({ settings });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}

export async function PUT(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/reminders/settings' },
    async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new ApiError('unauthorized', 'Not authenticated.', 401);
      }

      const decision = consumeRateLimit(
        getReminderRateLimitKey(session.user.id, 'settings:update'),
        REMINDER_SETTINGS_RATE_LIMIT,
      );
      if (decision.limited) {
        const response = jsonError(
          new ApiError('rate_limited', 'Too many requests. Try again later.', 429, 'retry_later'),
        );
        applyRateLimitHeaders(response.headers, decision);
        return response;
      }

      const body = await request.json();
      const parsed = updateReminderSettingsSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const existing = await prisma.userReminderSettings.findUnique({
        where: { userId: session.user.id },
        select: {
          dailyDigestEnabled: true,
          dailyDigestTimeMinutes: true,
          quietHoursEnabled: true,
          quietHoursStartMinutes: true,
          quietHoursEndMinutes: true,
          snoozeDefaultMinutes: true,
        },
      });

      const base = resolveReminderSettings(existing);
      const next = {
        dailyDigestEnabled: parsed.data.dailyDigestEnabled ?? base.dailyDigestEnabled,
        dailyDigestTimeMinutes:
          parsed.data.dailyDigestTimeMinutes ?? base.dailyDigestTimeMinutes,
        quietHoursEnabled: parsed.data.quietHoursEnabled ?? base.quietHoursEnabled,
        quietHoursStartMinutes:
          parsed.data.quietHoursStartMinutes ?? base.quietHoursStartMinutes,
        quietHoursEndMinutes:
          parsed.data.quietHoursEndMinutes ?? base.quietHoursEndMinutes,
        snoozeDefaultMinutes:
          parsed.data.snoozeDefaultMinutes ?? base.snoozeDefaultMinutes,
      };

      const validationError = getReminderSettingsValidationError(next);
      if (validationError) {
        throw new ApiError('invalid_request', validationError, 400);
      }

      const saved = await prisma.userReminderSettings.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...next,
        },
        update: {
          ...next,
        },
        select: {
          dailyDigestEnabled: true,
          dailyDigestTimeMinutes: true,
          quietHoursEnabled: true,
          quietHoursStartMinutes: true,
          quietHoursEndMinutes: true,
          snoozeDefaultMinutes: true,
        },
      });

      return jsonOk<ReminderSettingsResponse>({
        settings: resolveReminderSettings(saved),
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
