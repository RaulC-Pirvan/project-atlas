-- CreateTable
CREATE TABLE "AchievementUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AchievementUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitMilestoneUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitMilestoneUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AchievementUnlock_userId_achievementId_key" ON "AchievementUnlock"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "AchievementUnlock_userId_idx" ON "AchievementUnlock"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HabitMilestoneUnlock_userId_habitId_milestoneId_key" ON "HabitMilestoneUnlock"("userId", "habitId", "milestoneId");

-- CreateIndex
CREATE INDEX "HabitMilestoneUnlock_userId_idx" ON "HabitMilestoneUnlock"("userId");

-- CreateIndex
CREATE INDEX "HabitMilestoneUnlock_habitId_idx" ON "HabitMilestoneUnlock"("habitId");

-- AddForeignKey
ALTER TABLE "AchievementUnlock" ADD CONSTRAINT "AchievementUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitMilestoneUnlock" ADD CONSTRAINT "HabitMilestoneUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitMilestoneUnlock" ADD CONSTRAINT "HabitMilestoneUnlock_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
