'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type AchievementToastKind = 'progress' | 'unlock';

export type AchievementToastItem = {
  id: number;
  kind: AchievementToastKind;
  title: string;
  description?: ReactNode;
  current: number;
  target: number;
  ratio: number;
  tier: 'free' | 'pro';
  fromCurrent?: number;
  fromRatio?: number;
  state?: 'entering' | 'open' | 'closing';
};

type AchievementToastStackProps = {
  toasts: AchievementToastItem[];
  onDismiss?: (id: number) => void;
};

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function formatProgress(current: number, target: number) {
  return `${current} / ${target}`;
}

function AchievementToastCard({
  toast,
  onDismiss,
}: {
  toast: AchievementToastItem;
  onDismiss?: (id: number) => void;
}) {
  const initialCurrent = toast.fromCurrent ?? toast.current;
  const initialRatio = toast.fromRatio ?? toast.ratio;
  const [displayCurrent, setDisplayCurrent] = useState(initialCurrent);
  const [displayRatio, setDisplayRatio] = useState(initialRatio);

  useEffect(() => {
    if (toast.kind !== 'progress') {
      setDisplayCurrent(toast.current);
      setDisplayRatio(toast.ratio);
      return;
    }

    if (prefersReducedMotion()) {
      setDisplayCurrent(toast.current);
      setDisplayRatio(toast.ratio);
      return;
    }

    const startCurrent = toast.fromCurrent ?? toast.current;
    const endCurrent = toast.current;
    const startRatio = toast.fromRatio ?? toast.ratio;
    const endRatio = toast.ratio;
    const duration = 320;
    const start = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextCurrent = Math.round(startCurrent + (endCurrent - startCurrent) * eased);
      const nextRatio = startRatio + (endRatio - startRatio) * eased;
      setDisplayCurrent(nextCurrent);
      setDisplayRatio(nextRatio);
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [toast.current, toast.fromCurrent, toast.fromRatio, toast.kind, toast.ratio]);

  const statusLabel = toast.kind === 'unlock' ? 'Unlocked' : 'Progress';
  const barTone = toast.kind === 'unlock' ? 'bg-[#FAB95B]' : 'bg-black/60 dark:bg-white/70';
  const barWidth = `${Math.round(Math.min(1, displayRatio) * 100)}%`;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDismiss ? () => onDismiss(toast.id) : undefined}
      className={`pointer-events-auto rounded-2xl border border-black/10 bg-white/95 px-5 py-4 text-sm shadow-[0_18px_40px_rgba(0,0,0,0.16)] transition-all duration-200 dark:border-white/10 dark:bg-black/85 dark:shadow-[0_18px_40px_rgba(0,0,0,0.5)] ${
        toast.state === 'closing'
          ? 'translate-y-3 opacity-0 ease-in'
          : toast.state === 'entering'
            ? 'translate-y-3 opacity-0 ease-out'
            : 'translate-y-0 opacity-100 ease-out'
      } ${onDismiss ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-black/50 dark:text-white/50">
            {statusLabel}
          </p>
          <p className="text-sm font-semibold text-black dark:text-white">{toast.title}</p>
          {toast.description ? (
            <p className="text-xs text-black/60 dark:text-white/60">{toast.description}</p>
          ) : null}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
          {toast.tier === 'pro' ? 'Pro' : 'Free'}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-black/50 dark:text-white/50">
          <span>{formatProgress(displayCurrent, toast.target)}</span>
          <span>{Math.round(Math.min(1, displayRatio) * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10">
          <div
            className={`h-1.5 rounded-full ${barTone} motion-safe:transition-[width] motion-safe:duration-300`}
            style={{ width: barWidth }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

export function AchievementToastStack({ toasts, onDismiss }: AchievementToastStackProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  const content = (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col gap-3 px-4">
      {toasts.map((toast) => (
        <AchievementToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );

  return createPortal(content, document.body);
}
