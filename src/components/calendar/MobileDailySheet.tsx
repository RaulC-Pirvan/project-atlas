'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DailyCompletionPanel } from './DailyCompletionPanel';

type HabitSummary = {
  id: string;
  title: string;
  description: string | null;
};

type MobileDailySheetProps = {
  selectedDateKey: string | null;
  selectedLabel: string | null;
  habits: HabitSummary[];
  initialCompletedHabitIds: string[];
  completionWindowLockReason: 'future' | 'grace_expired' | 'history_blocked' | null;
  timeZone: string;
  autoOpen?: boolean;
  keepCompletedAtBottom?: boolean;
};

export function MobileDailySheet({
  selectedDateKey,
  selectedLabel,
  habits,
  initialCompletedHabitIds,
  completionWindowLockReason,
  timeZone,
  autoOpen = true,
  keepCompletedAtBottom = true,
}: MobileDailySheetProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const sheetId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedDateKey) {
      setOpen(false);
      return;
    }
    if (autoOpen) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [selectedDateKey, autoOpen]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement | null;
      window.requestAnimationFrame(() => closeButtonRef.current?.focus());
      return;
    }

    if (lastActiveRef.current) {
      lastActiveRef.current.focus();
      lastActiveRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!selectedDateKey) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('[data-date-key]') as HTMLElement | null;
      if (!anchor) return;
      if (anchor.getAttribute('data-date-key') === selectedDateKey) {
        setOpen(true);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [selectedDateKey]);

  if (!selectedDateKey) {
    return null;
  }

  if (!mounted) {
    return null;
  }

  const content = (
    <div className="lg:hidden">
      <div
        className={`fixed inset-0 z-50 flex flex-col justify-end ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <button
          type="button"
          aria-label="Close daily view"
          onClick={() => setOpen(false)}
          aria-hidden={!open}
          className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none ${
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-hidden={!open}
          id={sheetId}
          className={`relative rounded-t-3xl border-x-0 border-t border-black/10 bg-white px-4 pb-6 pt-4 shadow-[0_-20px_40px_rgba(0,0,0,0.2)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none dark:border-white/10 dark:bg-black dark:shadow-[0_-20px_40px_rgba(0,0,0,0.5)] ${
            open ? 'translate-y-0' : 'pointer-events-none translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                id={titleId}
                className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60"
              >
                Daily view
              </p>
              <p className="text-sm font-semibold">{selectedLabel ?? 'Selected day'}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              ref={closeButtonRef}
              className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-black/20 px-3 text-xs font-semibold uppercase tracking-[0.25em] text-black/70 transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10 dark:focus-visible:ring-white/30"
            >
              Close
            </button>
          </div>

          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            <DailyCompletionPanel
              selectedDateKey={selectedDateKey}
              selectedLabel={selectedLabel}
              habits={habits}
              initialCompletedHabitIds={initialCompletedHabitIds}
              completionWindowLockReason={completionWindowLockReason}
              timeZone={timeZone}
              keepCompletedAtBottom={keepCompletedAtBottom}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
