'use client';

import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Notice } from '../ui/Notice';

function download(path: string) {
  if (typeof window === 'undefined') return;
  window.location.href = path;
}

export function AdminExportPanel() {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold">CSV exports</p>
        <p className="text-xs text-black/50 dark:text-white/50">
          Export user and habit snapshots for offline review.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => download('/api/admin/exports/users')}
        >
          Download users CSV
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => download('/api/admin/exports/habits')}
        >
          Download habits CSV
        </Button>
      </div>
      <Notice>Exports include email, display name, and timestamps only.</Notice>
    </Card>
  );
}
