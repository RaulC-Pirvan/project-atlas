import { notFound, redirect } from 'next/navigation';

import { getServerAuthSession } from '../../../lib/auth/session';
import { prisma } from '../../../lib/db/prisma';

type RouteParams = {
  date: string;
};

function parseDateParam(value: string): { year: number; month: number; day: number } | null {
  const match = /^\d{4}-\d{2}-\d{2}$/.exec(value);
  if (!match) return null;
  const [yearPart, monthPart, dayPart] = value.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function formatMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function formatDateParam(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default async function CalendarDayPage({
  params,
}: {
  params: RouteParams | Promise<RouteParams>;
}) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const resolvedParams = await params;
  const parts = parseDateParam(resolvedParams.date);

  if (!parts) {
    notFound();
  }

  const monthParam = formatMonthParam(parts.year, parts.month);
  const dateParam = formatDateParam(parts.year, parts.month, parts.day);
  redirect(`/calendar?month=${monthParam}&date=${dateParam}`);
}
