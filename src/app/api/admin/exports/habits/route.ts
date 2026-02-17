import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { requireAdminSession } from '../../../../../lib/admin/auth';
import { buildCsv, listExportHabits } from '../../../../../lib/admin/exports';
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
    { route: '/api/admin/exports/habits' },
    async () => {
      const session = await getServerSession(authOptions);
      await requireAdminSession(session);

      const rows = await listExportHabits(prisma);

      const csv = buildCsv(
        [
          'Title',
          'Description',
          'Schedule',
          'Archived at',
          'Created at',
          'Owner email',
          'Owner name',
        ],
        rows.map((habit) => [
          habit.title,
          habit.description ?? '',
          habit.scheduleSummary,
          habit.archivedAt,
          habit.createdAt,
          habit.ownerEmail,
          habit.ownerName,
        ]),
      );

      const filename = `admin-habits-${getDateStamp()}.csv`;

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
