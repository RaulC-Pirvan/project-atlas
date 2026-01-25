export type ApiErrorCode =
  | 'invalid_request'
  | 'email_taken'
  | 'rate_limited'
  | 'token_invalid'
  | 'token_expired'
  | 'internal_error';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function asApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError('internal_error', 'Internal server error.', 500);
}
