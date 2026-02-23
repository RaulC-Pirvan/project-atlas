import crypto from 'node:crypto';

import { logProConversionEvent } from '../../../../../lib/analytics/proConversion';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import type { BillingPersistenceClient } from '../../../../../lib/billing/persistence';
import { appendBillingEventAndProject } from '../../../../../lib/billing/persistence';
import { getStripeWebhookConfig } from '../../../../../lib/billing/stripe/config';
import {
  normalizeStripeWebhookEventToCanonicalEvent,
  parseStripeWebhookEvent,
} from '../../../../../lib/billing/stripe/normalize';
import { verifyStripeWebhookSignature } from '../../../../../lib/billing/stripe/signature';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

function buildPayloadHash(payload: string): string {
  return `sha256:${crypto.createHash('sha256').update(payload, 'utf8').digest('hex')}`;
}

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/billing/stripe/webhook' },
    async () => {
      const rawBody = await request.text();
      const signatureHeader = request.headers.get('stripe-signature');

      const webhookConfig = getStripeWebhookConfig();
      const validSignature = verifyStripeWebhookSignature({
        payload: rawBody,
        signatureHeader,
        secret: webhookConfig.webhookSecret,
        toleranceSeconds: webhookConfig.webhookToleranceSeconds,
      });

      if (!validSignature) {
        throw new ApiError('forbidden', 'Invalid webhook signature.', 403, 'none');
      }

      const stripeEvent = parseStripeWebhookEvent(rawBody);
      if (!stripeEvent) {
        throw new ApiError('invalid_request', 'Invalid webhook payload.', 400, 'none');
      }

      const payloadHash = buildPayloadHash(rawBody);
      const canonicalEvent = normalizeStripeWebhookEventToCanonicalEvent({
        event: stripeEvent,
        receivedAt: new Date(),
        payloadHash,
      });

      if (!canonicalEvent) {
        return jsonOk({ received: true, ignored: true });
      }

      const result = await appendBillingEventAndProject({
        prisma: prisma as unknown as BillingPersistenceClient,
        event: canonicalEvent,
        signatureVerified: true,
      });

      if (result.appended && result.projection.status === 'active') {
        logProConversionEvent({
          event: 'pro_entitlement_active',
          surface: '/api/billing/stripe/webhook',
          authenticated: Boolean(result.ledgerEvent.userId),
          userId: result.ledgerEvent.userId,
          provider: 'stripe',
          dedupeReason: result.dedupeReason,
          isPro: true,
        });
      }

      return jsonOk({
        received: true,
        ignored: false,
        appended: result.appended,
        dedupeReason: result.dedupeReason,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
