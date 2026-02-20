import { describe, expect, it } from 'vitest';

import { buildUserDataExportFilename } from '../filename';

describe('buildUserDataExportFilename', () => {
  it('formats a stable timestamp filename for json exports', () => {
    const filename = buildUserDataExportFilename(new Date('2026-02-20T16:45:12.345Z'));

    expect(filename).toBe('20260220T164512Z-atlas-data-export.json');
  });
});
