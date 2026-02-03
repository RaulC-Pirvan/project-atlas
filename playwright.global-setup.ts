import 'dotenv/config';

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  execSync('npx prisma generate', { stdio: 'inherit' });
  if (process.env.DATABASE_URL && process.env.PLAYWRIGHT_RUN_MIGRATIONS === 'true') {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  }

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
