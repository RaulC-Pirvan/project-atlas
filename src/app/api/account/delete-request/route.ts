import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new ApiError('unauthorized', 'Not authenticated.', 401);
    }

    return jsonOk({ ok: true }, 202);
  } catch (error) {
    return jsonError(asApiError(error));
  }
}
