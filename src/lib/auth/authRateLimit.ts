export const AUTH_RATE_LIMIT = {
  windowMs: 1000 * 60 * 5,
  max: 10,
  blockMs: 1000 * 60 * 10,
};

export function shouldBypassAuthRateLimit() {
  return process.env.ENABLE_TEST_ENDPOINTS === 'true';
}
