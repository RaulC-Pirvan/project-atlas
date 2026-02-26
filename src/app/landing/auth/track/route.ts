import {
  logFunnelEvent,
  logFunnelGuardrail,
  parseLandingAuthCtaSourceWithReason,
  parseLandingAuthCtaTargetWithReason,
} from '../../../../lib/analytics/funnel';
import { getServerAuthSession } from '../../../../lib/auth/session';
import { getRequestId } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = getRequestId(request);
  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? null;
  const authenticated = Boolean(userId);

  const parsedSource = parseLandingAuthCtaSourceWithReason(searchParams.get('source'));
  const parsedTarget = parseLandingAuthCtaTargetWithReason(searchParams.get('target'));

  if (parsedSource.reason === 'invalid') {
    logFunnelGuardrail({
      reason: 'invalid_source_fallback',
      event: 'landing_auth_cta_click',
      surface: '/landing/auth/track',
      authenticated,
      userId,
      source: parsedSource.source,
      target: parsedTarget.target,
      requestId,
      rawSource: parsedSource.raw,
    });
  }

  if (parsedTarget.reason === 'invalid') {
    logFunnelGuardrail({
      reason: 'invalid_target_fallback',
      event: 'landing_auth_cta_click',
      surface: '/landing/auth/track',
      authenticated,
      userId,
      source: parsedSource.source,
      target: parsedTarget.target,
      requestId,
      rawTarget: parsedTarget.raw,
    });
  }

  logFunnelEvent({
    event: 'landing_auth_cta_click',
    surface: '/landing/auth/track',
    authenticated,
    userId,
    source: parsedSource.source,
    target: parsedTarget.target,
    requestId,
  });

  const targetUrl = new URL(parsedTarget.target, request.url);
  return Response.redirect(targetUrl, 303);
}
