import { getServerSession } from 'next-auth/next';

import { requireAdminSession } from '../../../../../lib/admin/auth';
import { updateAdminSupportTicketStatus } from '../../../../../lib/admin/support';
import { ApiError, asApiError } from '../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../lib/api/response';
import { updateAdminSupportTicketStatusSchema } from '../../../../../lib/api/support/validation';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  return withApiLogging(
    request,
    { route: '/api/admin/support/[id]' },
    async () => {
      const session = await getServerSession(authOptions);
      await requireAdminSession(session);

      const { id } = await context.params;
      if (!id || id.trim().length === 0) {
        throw new ApiError('invalid_request', 'Support ticket id is required.', 400);
      }

      const body = await request.json();
      const parsed = updateAdminSupportTicketStatusSchema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError('invalid_request', 'Invalid request.', 400);
      }

      const ticket = await updateAdminSupportTicketStatus({
        prisma,
        ticketId: id,
        status: parsed.data.status,
      });

      return jsonOk({ ticket });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
