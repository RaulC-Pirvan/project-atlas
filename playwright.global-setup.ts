import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  if (process.platform !== 'win32') return;

  const baseDir = process.env.LOCALAPPDATA ?? process.cwd();
  const playwrightTempDir = path.join(baseDir, 'playwright-tmp');
  if (!fs.existsSync(playwrightTempDir)) {
    fs.mkdirSync(playwrightTempDir, { recursive: true });
  }

  process.env.TEMP = playwrightTempDir;
  process.env.TMP = playwrightTempDir;
  process.env.TMPDIR = playwrightTempDir;
}
