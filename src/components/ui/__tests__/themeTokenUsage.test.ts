import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const filesUsingThemeTokens = [
  {
    path: 'src/components/calendar/CalendarMonth.tsx',
    expectedToken: 'var(--color-accent-',
  },
  {
    path: 'src/components/insights/InsightsDashboard.tsx',
    expectedToken: 'var(--color-accent-',
  },
  {
    path: 'src/components/achievements/AchievementsDashboard.tsx',
    expectedToken: 'var(--color-accent-',
  },
  {
    path: 'src/components/admin/AdminSidebar.tsx',
    expectedToken: 'var(--color-border-',
  },
];

const legacyAccentHexValues = ['#fab95b', '#e9a543'];

describe('theme token usage guardrails', () => {
  it('keeps key surfaces on semantic accent tokens', () => {
    for (const entry of filesUsingThemeTokens) {
      const absolutePath = path.resolve(process.cwd(), entry.path);
      const source = readFileSync(absolutePath, 'utf8');

      expect(source).toContain(entry.expectedToken);

      const sourceLower = source.toLowerCase();
      for (const legacyHex of legacyAccentHexValues) {
        expect(sourceLower).not.toContain(legacyHex);
      }
    }
  });
});
