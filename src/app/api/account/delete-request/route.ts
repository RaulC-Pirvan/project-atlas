import { getServerSession } from 'next-auth/next';

import { ApiError, asApiError } from '../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../lib/api/response';
import { authOptions } from '../../../../lib/auth/nextauth';
import { prisma } from '../../../../lib/db/prisma';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new ApiError('unauthorized', 'Not authenticated.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!user) {
      throw new ApiError('not_found', 'User not found.', 404);
    }

    await prisma.user.delete({ where: { id: user.id } });

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(asApiError(error));
  }
}
