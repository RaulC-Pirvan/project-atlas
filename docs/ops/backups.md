# Database Backups - Project Atlas

**Status**: Draft (Phase 2)

---

## Goals

- Protect against accidental data loss or corruption.
- Provide a clear, repeatable restore path.
- Validate backups with periodic restore drills.

## Backup Principles

- Backups must be **automated** and **verifiable**.
- Backups must be stored outside the primary database instance.
- Production and staging backups remain separate.

---

## Recommended Strategy

### 1) Provider-Managed Backups

- Enable automated backups in the Postgres provider.
- Set retention to match policy (e.g., 14-30 days).
- Verify restore capability at least once per quarter.

### 2) Manual Snapshot (On Demand)

Create a manual snapshot before risky changes (migrations, data fixes).
Use `pg_dump` to export a point-in-time backup.

---

## Backup Commands (Manual)

> Requires `pg_dump` installed (Postgres client tools).

### Windows (PowerShell)

```powershell
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = "C:\backups\atlas-prod-$timestamp.dump"
pg_dump --format=custom --no-owner --no-acl --file $backupPath $env:DATABASE_URL
```

### macOS / Linux

```bash
timestamp=$(date +"%Y%m%d-%H%M%S")
backup_path="./backups/atlas-prod-$timestamp.dump"
pg_dump --format=custom --no-owner --no-acl --file "$backup_path" "$DATABASE_URL"
```

---

## Restore Commands (Drill)

> Restore into a **new staging database**, never production.

### Windows (PowerShell)

```powershell
pg_restore --clean --no-owner --no-acl --dbname $env:STAGING_DATABASE_URL "C:\backups\atlas-prod-<timestamp>.dump"
```

### macOS / Linux

```bash
pg_restore --clean --no-owner --no-acl --dbname "$STAGING_DATABASE_URL" "./backups/atlas-prod-<timestamp>.dump"
```

---

## Validation Checklist

- [x] Automated backups enabled in provider.
- [x] Manual snapshot procedure documented.
- [x] Restore drill performed into staging.
- [x] Restore verification includes core app flows.

---

## Notes

- Keep backup artifacts encrypted at rest (provider-managed or local policy).
- Store backup retention policy in `docs/ops/backups.md` once finalized.

---

## References

- `docs/sprints/sprint-6.3.md`
- `docs/ops/staging.md`
