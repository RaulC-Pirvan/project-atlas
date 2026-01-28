import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { AppShell } from '../../../components/layout/AppShell';
import { getServerAuthSession } from '../../../lib/auth/session';
import { prisma } from '../../../lib/db/prisma';
import { toUtcDateFromParts } from '../../../lib/habits/dates';

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

  const date = toUtcDateFromParts(parts);
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  const monthHref = `/calendar?month=${formatMonthParam(parts.year, parts.month)}`;

  return (
    <AppShell title="Daily View" subtitle={label}>
      <div className="space-y-4 text-sm text-black/60">
        <p>Daily habit completion lands in Sprint 2.2.</p>
        <Link
          href={monthHref}
          className="inline-flex text-xs font-semibold uppercase tracking-[0.3em] text-black"
        >
          Back to calendar
        </Link>
      </div>
    </AppShell>
  );
}
