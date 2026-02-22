-- Allow account deletion for users with billing history while preserving append-only billing events.

ALTER TABLE "BillingEventLedger"
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "BillingEventLedger"
DROP CONSTRAINT IF EXISTS "BillingEventLedger_userId_fkey";

ALTER TABLE "BillingEventLedger"
ADD CONSTRAINT "BillingEventLedger_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_billing_event_ledger_mutation()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD."userId" IS NOT NULL
    AND NEW."userId" IS NULL
    AND (to_jsonb(NEW) - 'userId') = (to_jsonb(OLD) - 'userId') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'BillingEventLedger is append-only and cannot be mutated';
END;
$$ LANGUAGE plpgsql;
