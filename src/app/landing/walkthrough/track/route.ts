import {
  logLandingWalkthroughEvent,
  logLandingWalkthroughGuardrail,
  parseLandingWalkthroughSourceWithReason,
  parseLandingWalkthroughTargetWithReason,
} from '../../../../lib/analytics/landingWalkthrough';
import { getServerAuthSession } from '../../../../lib/auth/session';
import { getRequestId } from '../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestId = getRequestId(request);

  const session = await getServerAuthSession();
  const userId = session?.user?.id ?? null;
  const authenticated = Boolean(userId);

  const parsedSource = parseLandingWalkthroughSourceWithReason(searchParams.get('source'));
  const parsedTarget = parseLandingWalkthroughTargetWithReason({
    value: searchParams.get('target'),
    authenticated,
  });

  if (parsedSource.reason === 'invalid') {
    logLandingWalkthroughGuardrail({
      reason: 'invalid_source_fallback',
      surface: '/landing/walkthrough/track',
      authenticated,
      userId,
      source: parsedSource.source,
      rawSource: parsedSource.raw,
      requestId,
    });
  }

  if (parsedTarget.reason === 'invalid' || parsedTarget.reason === 'mismatch') {
    logLandingWalkthroughGuardrail({
      reason: 'invalid_target_fallback',
      surface: '/landing/walkthrough/track',
      authenticated,
      userId,
      source: parsedSource.source,
      target: parsedTarget.target,
      rawTarget: parsedTarget.raw,
      requestId,
    });
  }

  logLandingWalkthroughEvent({
    event: 'landing_walkthrough_cta_click',
    surface: '/landing/walkthrough/track',
    authenticated,
    userId,
    source: parsedSource.source,
    target: parsedTarget.target,
    requestId,
  });

  const targetUrl = new URL(parsedTarget.target, request.url);
  return Response.redirect(targetUrl, 303);
}
