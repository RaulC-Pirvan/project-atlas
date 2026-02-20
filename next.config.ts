import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

import { assertLegalPublishReadiness } from './src/lib/legal/publishEnforcement';

assertLegalPublishReadiness({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  enforcementFlag: process.env.ENFORCE_LEGAL_PUBLISH_READY ?? 'false',
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, { silent: true, tunnelRoute: '/_obs' });
