'use client';

import { useRef, useState } from 'react';

import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { MAX_SNOOZE_DAILY_MINUTES, MAX_SNOOZE_MINUTES } from '../../lib/reminders/constants';
import { minutesToTimeString, timeStringToMinutes } from '../../lib/reminders/time';
import type { UserReminderSettings } from '../../lib/reminders/types';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { type ToastItem, ToastStack } from '../ui/Toast';

type ReminderSettingsPanelProps = {
  initialSettings: UserReminderSettings;
  timezoneLabel: string;
};

type ReminderSettingsResponse = {
  settings: UserReminderSettings;
};

export function ReminderSettingsPanel({
  initialSettings,
  timezoneLabel,
}: ReminderSettingsPanelProps) {
  const [dailyDigestEnabled, setDailyDigestEnabled] = useState(initialSettings.dailyDigestEnabled);
  const [dailyDigestTime, setDailyDigestTime] = useState(
    minutesToTimeString(initialSettings.dailyDigestTimeMinutes),
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(initialSettings.quietHoursEnabled);
  const [quietHoursStart, setQuietHoursStart] = useState(
    minutesToTimeString(initialSettings.quietHoursStartMinutes),
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    minutesToTimeString(initialSettings.quietHoursEndMinutes),
  );
  const [snoozeDefault, setSnoozeDefault] = useState(String(initialSettings.snoozeDefaultMinutes));
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [baseline, setBaseline] = useState(initialSettings);
  const toastIdRef = useRef(0);

  const pushToast = (message: string, tone: ToastItem['tone'] = 'neutral') => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((prev) => [...prev, { id, tone, message, state: 'entering' }]);

    window.requestAnimationFrame(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: 'open' } : toast)),
      );
    });

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: 'closing' } : toast)),
      );
    }, 4500);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4800);
  };

  const hasChanges =
    dailyDigestEnabled !== baseline.dailyDigestEnabled ||
    dailyDigestTime !== minutesToTimeString(baseline.dailyDigestTimeMinutes) ||
    quietHoursEnabled !== baseline.quietHoursEnabled ||
    quietHoursStart !== minutesToTimeString(baseline.quietHoursStartMinutes) ||
    quietHoursEnd !== minutesToTimeString(baseline.quietHoursEndMinutes) ||
    Number(snoozeDefault) !== baseline.snoozeDefaultMinutes;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasChanges) {
      pushToast('No changes to update.', 'neutral');
      return;
    }

    const digestMinutes = timeStringToMinutes(dailyDigestTime);
    if (digestMinutes === null) {
      pushToast('Daily digest time is invalid.', 'error');
      return;
    }

    const quietStartMinutes = timeStringToMinutes(quietHoursStart);
    if (quietStartMinutes === null) {
      pushToast('Quiet hours start time is invalid.', 'error');
      return;
    }

    const quietEndMinutes = timeStringToMinutes(quietHoursEnd);
    if (quietEndMinutes === null) {
      pushToast('Quiet hours end time is invalid.', 'error');
      return;
    }

    const snoozeMinutes = Number(snoozeDefault);
    if (!Number.isFinite(snoozeMinutes) || !Number.isInteger(snoozeMinutes)) {
      pushToast('Snooze duration must be a whole number.', 'error');
      return;
    }
    if (snoozeMinutes < 1 || snoozeMinutes > MAX_SNOOZE_MINUTES) {
      pushToast(`Snooze duration must be 1-${MAX_SNOOZE_MINUTES} minutes.`, 'error');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/reminders/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyDigestEnabled,
          dailyDigestTimeMinutes: digestMinutes,
          quietHoursEnabled,
          quietHoursStartMinutes: quietStartMinutes,
          quietHoursEndMinutes: quietEndMinutes,
          snoozeDefaultMinutes: snoozeMinutes,
        }),
      });
      const body = await parseJson<ReminderSettingsResponse>(response);
      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setBaseline(body.data.settings);
      setDailyDigestEnabled(body.data.settings.dailyDigestEnabled);
      setDailyDigestTime(minutesToTimeString(body.data.settings.dailyDigestTimeMinutes));
      setQuietHoursEnabled(body.data.settings.quietHoursEnabled);
      setQuietHoursStart(minutesToTimeString(body.data.settings.quietHoursStartMinutes));
      setQuietHoursEnd(minutesToTimeString(body.data.settings.quietHoursEndMinutes));
      setSnoozeDefault(String(body.data.settings.snoozeDefaultMinutes));
      pushToast('Reminder settings updated.', 'success');
    } catch {
      pushToast('Reminder settings update is not available yet.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10 sm:rounded-3xl sm:border sm:px-6 sm:py-6"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
          Reminders
        </p>
        <p className="text-sm text-black/60 dark:text-white/60">
          Times use your timezone ({timezoneLabel}). Reminders skip completed habits.
        </p>
      </div>

      <FormField id="reminder-digest-toggle" label="Daily digest" error={null}>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={dailyDigestEnabled ? 'primary' : 'outline'}
            onClick={() => setDailyDigestEnabled(true)}
          >
            On
          </Button>
          <Button
            type="button"
            size="sm"
            variant={!dailyDigestEnabled ? 'primary' : 'outline'}
            onClick={() => setDailyDigestEnabled(false)}
          >
            Off
          </Button>
        </div>
      </FormField>

      <FormField
        id="reminder-digest-time"
        label="Digest time"
        hint="Use 24-hour time (HH:MM). Default is 20:00."
        error={null}
      >
        <Input
          id="reminder-digest-time"
          type="text"
          inputMode="numeric"
          pattern="[0-2][0-9]:[0-5][0-9]"
          placeholder="HH:MM"
          value={dailyDigestTime}
          onChange={(event) => setDailyDigestTime(event.target.value)}
          disabled={!dailyDigestEnabled}
          className="max-w-[180px]"
        />
      </FormField>

      <FormField id="quiet-hours-toggle" label="Quiet hours" error={null}>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={quietHoursEnabled ? 'primary' : 'outline'}
            onClick={() => setQuietHoursEnabled(true)}
          >
            On
          </Button>
          <Button
            type="button"
            size="sm"
            variant={!quietHoursEnabled ? 'primary' : 'outline'}
            onClick={() => setQuietHoursEnabled(false)}
          >
            Off
          </Button>
        </div>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="quiet-hours-start"
          label="Quiet hours start"
          hint="Use 24-hour time (HH:MM). Suggested 22:00."
          error={null}
        >
          <Input
            id="quiet-hours-start"
            type="text"
            inputMode="numeric"
            pattern="[0-2][0-9]:[0-5][0-9]"
            placeholder="HH:MM"
            value={quietHoursStart}
            onChange={(event) => setQuietHoursStart(event.target.value)}
            disabled={!quietHoursEnabled}
          />
        </FormField>
        <FormField
          id="quiet-hours-end"
          label="Quiet hours end"
          hint="Use 24-hour time (HH:MM). Suggested 07:00."
          error={null}
        >
          <Input
            id="quiet-hours-end"
            type="text"
            inputMode="numeric"
            pattern="[0-2][0-9]:[0-5][0-9]"
            placeholder="HH:MM"
            value={quietHoursEnd}
            onChange={(event) => setQuietHoursEnd(event.target.value)}
            disabled={!quietHoursEnabled}
          />
        </FormField>
      </div>

      <FormField
        id="snooze-default"
        label="Default snooze"
        hint={`10 minutes recommended. Max ${MAX_SNOOZE_MINUTES} minutes.`}
        error={null}
      >
        <Input
          id="snooze-default"
          type="number"
          min={1}
          max={MAX_SNOOZE_MINUTES}
          value={snoozeDefault}
          onChange={(event) => setSnoozeDefault(event.target.value)}
          className="max-w-[160px]"
        />
      </FormField>

      <p className="text-xs text-black/50 dark:text-white/50">
        Snooze is same-day only. Total snooze time is capped at {MAX_SNOOZE_DAILY_MINUTES} minutes
        per day.
      </p>

      <Button type="submit" variant="outline" className="w-full" disabled={saving}>
        {saving ? 'Saving...' : 'Save reminder settings'}
      </Button>

      <ToastStack toasts={toasts} />
    </form>
  );
}
