import { describe, expect, it } from 'vitest';

import { ApiError, asApiError, getApiErrorRecovery } from '../errors';

describe('api errors', () => {
  it('returns api errors as-is', () => {
    const error = new ApiError('invalid_request', 'Bad request.', 400);

    expect(asApiError(error)).toBe(error);
  });

  it('wraps unknown errors in a default api error', () => {
    const result = asApiError(new Error('boom'));

    expect(result.code).toBe('internal_error');
    expect(result.status).toBe(500);
    expect(result.message).toBe('Internal server error.');
  });

  it('maps api error recovery hints', () => {
    expect(getApiErrorRecovery('rate_limited', 400)).toBe('retry_later');
    expect(getApiErrorRecovery('unauthorized', 401)).toBe('reauth');
    expect(getApiErrorRecovery('email_taken', 409)).toBe('update_input');
    expect(getApiErrorRecovery('token_invalid', 400)).toBe('resend');
    expect(getApiErrorRecovery('internal_error', 500)).toBe('retry');
    expect(getApiErrorRecovery('not_found', 404)).toBe('none');
  });
});
