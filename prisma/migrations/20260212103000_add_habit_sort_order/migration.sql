-- AlterTable
ALTER TABLE "Habit" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill sort order per user (0-based)
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" ASC, "id" ASC) - 1 AS rn
  FROM "Habit"
)
UPDATE "Habit"
SET "sortOrder" = ordered.rn
FROM ordered
WHERE "Habit"."id" = ordered.id;

-- CreateIndex
CREATE INDEX "Habit_userId_sortOrder_idx" ON "Habit"("userId", "sortOrder");