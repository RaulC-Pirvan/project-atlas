import { signupUser } from '../../../../lib/api/auth/signup';
import { signupSchema } from '../../../../lib/api/auth/validation';
import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { prisma } from '../../../../lib/db/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError('invalid_request', 'Invalid request.', 400);
    }

    const result = await signupUser({
      prisma,
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
    });

    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(asApiError(error));
  }
}
