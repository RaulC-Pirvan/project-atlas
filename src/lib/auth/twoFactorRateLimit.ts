export const TWO_FACTOR_CHALLENGE_RATE_LIMIT = {
  windowMs: 1000 * 60 * 5,
  max: 5,
  blockMs: 1000 * 60 * 10,
};

export function shouldBypassTwoFactorRateLimit() {
  return process.env.ENABLE_TEST_ENDPOINTS === 'true';
}
