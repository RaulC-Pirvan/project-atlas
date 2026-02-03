import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';

import { AdminActivityPanel } from '@/components/admin/AdminActivityPanel';
import { AdminExportPanel } from '@/components/admin/AdminExportPanel';
import { AdminHabitsPanel } from '@/components/admin/AdminHabitsPanel';
import { AdminHealthPanel } from '@/components/admin/AdminHealthPanel';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminUsersPanel } from '@/components/admin/AdminUsersPanel';
import { requireAdminSession } from '@/lib/admin/auth';
import { authOptions } from '@/lib/auth/nextauth';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  try {
    requireAdminSession(session);
  } catch {
    redirect('/calendar');
  }

  return (
    <AdminShell
      title="Admin dashboard"
      subtitle="Read-only visibility for internal health, users, habits, and activity."
    >
      <div className="space-y-10">
        <section id="health" aria-labelledby="admin-health" className="space-y-3">
          <div className="space-y-1">
            <h2 id="admin-health" className="text-lg font-semibold">
              Health status
            </h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              API uptime and basic checks from /api/admin/health.
            </p>
          </div>
          <AdminHealthPanel />
        </section>

        <section id="users" aria-labelledby="admin-users" className="space-y-3">
          <div className="space-y-1">
            <h2 id="admin-users" className="text-lg font-semibold">
              Users
            </h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              Searchable list with verified status and timestamps.
            </p>
          </div>
          <AdminUsersPanel />
        </section>

        <section id="habits" aria-labelledby="admin-habits" className="space-y-3">
          <div className="space-y-1">
            <h2 id="admin-habits" className="text-lg font-semibold">
              Habits
            </h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              Active and archived habits with schedule summaries.
            </p>
          </div>
          <AdminHabitsPanel />
        </section>

        <section id="activity" aria-labelledby="admin-activity" className="space-y-3">
          <div className="space-y-1">
            <h2 id="admin-activity" className="text-lg font-semibold">
              Recent activity
            </h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              Structured log feed without PII.
            </p>
          </div>
          <AdminActivityPanel />
        </section>

        <section id="export" aria-labelledby="admin-export" className="space-y-3">
          <div className="space-y-1">
            <h2 id="admin-export" className="text-lg font-semibold">
              Export
            </h2>
            <p className="text-sm text-black/60 dark:text-white/60">
              Admin-safe CSV exports for users and habits.
            </p>
          </div>
          <AdminExportPanel />
        </section>
      </div>
    </AdminShell>
  );
}
