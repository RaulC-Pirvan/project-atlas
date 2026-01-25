import { resendVerification } from '../../../../lib/api/auth/resendVerification';
import { resendVerificationSchema } from '../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { prisma } from '../../../../lib/db/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendVerificationSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('invalid_request', 'Invalid request.', 400);
    }

    const result = await resendVerification({
      prisma,
      email: parsed.data.email,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(asApiError(error));
  }
}
