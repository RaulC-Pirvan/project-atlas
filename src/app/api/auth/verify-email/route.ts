import { verifyEmailSchema } from '../../../../lib/api/auth/validation';
import { verifyEmail } from '../../../../lib/api/auth/verifyEmail';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { prisma } from '../../../../lib/db/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') ?? '';
    const parsed = verifyEmailSchema.safeParse({ token });
    if (!parsed.success) {
      throw new ApiError('invalid_request', 'Invalid request.', 400);
    }

    const result = await verifyEmail(prisma, parsed.data.token);
    return jsonOk(result);
  } catch (error) {
    return jsonError(asApiError(error));
  }
}
