const EXPORT_FILE_SUFFIX = '-atlas-data-export.json';

function toExportTimestamp(now: Date): string {
  const iso = now.toISOString();
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function buildUserDataExportFilename(now: Date = new Date()): string {
  return `${toExportTimestamp(now)}${EXPORT_FILE_SUFFIX}`;
}
