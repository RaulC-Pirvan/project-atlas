-- CreateTable
CREATE TABLE "UserReminderSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyDigestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigestTimeMinutes" SMALLINT NOT NULL DEFAULT 1200,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStartMinutes" SMALLINT NOT NULL DEFAULT 1320,
    "quietHoursEndMinutes" SMALLINT NOT NULL DEFAULT 420,
    "snoozeDefaultMinutes" SMALLINT NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReminderSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitReminder" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "timeMinutes" SMALLINT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HabitReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitReminderSnooze" (
    "id" TEXT NOT NULL,
    "habitReminderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "snoozedUntil" TIMESTAMP(3) NOT NULL,
    "totalMinutes" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HabitReminderSnooze_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReminderSettings_userId_key" ON "UserReminderSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HabitReminder_habitId_timeMinutes_key" ON "HabitReminder"("habitId", "timeMinutes");

-- CreateIndex
CREATE INDEX "HabitReminder_habitId_idx" ON "HabitReminder"("habitId");

-- CreateIndex
CREATE UNIQUE INDEX "HabitReminderSnooze_habitReminderId_localDate_key" ON "HabitReminderSnooze"("habitReminderId", "localDate");

-- CreateIndex
CREATE INDEX "HabitReminderSnooze_habitReminderId_idx" ON "HabitReminderSnooze"("habitReminderId");

-- CreateIndex
CREATE INDEX "HabitReminderSnooze_userId_idx" ON "HabitReminderSnooze"("userId");

-- CreateIndex
CREATE INDEX "HabitReminderSnooze_localDate_idx" ON "HabitReminderSnooze"("localDate");

-- AddForeignKey
ALTER TABLE "UserReminderSettings" ADD CONSTRAINT "UserReminderSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitReminder" ADD CONSTRAINT "HabitReminder_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitReminderSnooze" ADD CONSTRAINT "HabitReminderSnooze_habitReminderId_fkey" FOREIGN KEY ("habitReminderId") REFERENCES "HabitReminder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitReminderSnooze" ADD CONSTRAINT "HabitReminderSnooze_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
