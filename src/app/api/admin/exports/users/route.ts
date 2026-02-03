import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { requireAdminSession } from '../../../../../lib/admin/auth';
import { buildCsv, listExportUsers } from '../../../../../lib/admin/exports';
import { asApiError } from '../../../../../lib/api/errors';
import { jsonError } from '../../../../../lib/api/response';
import { authOptions } from '../../../../../lib/auth/nextauth';
import { prisma } from '../../../../../lib/db/prisma';
import { withApiLogging } from '../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/admin/exports/users' },
    async () => {
      const session = await getServerSession(authOptions);
      requireAdminSession(session);

      const rows = await listExportUsers(prisma);

      const csv = buildCsv(
        ['Email', 'Display name', 'Email verified at', 'Created at', 'Deleted at'],
        rows.map((user) => [
          user.email,
          user.displayName,
          user.emailVerifiedAt,
          user.createdAt,
          user.deletedAt,
        ]),
      );

      const filename = `admin-users-${getDateStamp()}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
