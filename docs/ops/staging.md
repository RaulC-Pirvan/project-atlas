# Staging Environment - Project Atlas

**Status**: Draft (Phase 2)

---

## Goals

- Provide a production-like environment for pre-release validation.
- Keep staging data isolated from production and safe for testing.
- Ensure auth, email verification, and observability behave like production.

## Non-Goals

- Load testing or performance benchmarking.
- Long-term analytics or data warehousing.

---

## Environment Topology

Recommended split:

- **Production**: `main` branch, production database, production domains.
- **Staging**: `staging` branch (or dedicated deploy), staging database, staging domains.

Use a **separate database** for staging. Never point staging at production.

---

## Hosting & Deploy Strategy

### Recommended

- Use a dedicated staging project on the hosting provider (or a staging environment).
- Deploy from a `staging` branch and keep it deployable at all times.
- Restrict access via shared credentials or basic auth where supported.

### Minimum Viable

- Use preview deployments with a stable staging branch.
- Ensure the database and env vars are isolated per preview.

---

## Required Environment Variables (Staging)

Set these in the staging environment:

- `DATABASE_URL` (staging DB)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (staging domain)
- `APP_URL` and/or `NEXT_PUBLIC_APP_URL` (for email link generation)
- `RESEND_API_KEY` (staging key)
- `RESEND_FROM_EMAIL` (staging sender)
- `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ENABLED=true`
- `NEXT_PUBLIC_SENTRY_ENABLED=true`
- `ADMIN_OWNER_EMAIL`
- `ADMIN_EMAIL_ALLOWLIST`
- `ENABLE_TEST_ENDPOINTS=false`

Optional:

- `SEED_PASSWORD` (if using seed data)

---

## Data Handling

- **Never** reuse production data.
- Prefer seed data created via `npm run prisma:seed`.
- Keep staging users isolated and disposable.

---

## Staging Verification Checklist

- [ ] `/api/health` returns 200 with stable payload.
- [ ] Auth signup + email verification works end-to-end.
- [ ] Habit lifecycle works (create, edit, archive, complete).
- [ ] Sentry receives errors (tunnel route active).
- [ ] Admin dashboard access is restricted to allowlist.
- [ ] `ENABLE_TEST_ENDPOINTS` is `false` in staging.

---

## Rollback Plan

- Keep the last known-good staging deploy available.
- Ensure database migrations are backwards compatible or reversible.
- Document a rollback procedure before production release.

---

## References

- `docs/context.md`
- `docs/roadmap.md`
- `docs/sprints/sprint-6.3.md`
