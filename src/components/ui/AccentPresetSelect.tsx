'use client';

import { useEffect, useId, useState } from 'react';

import {
  ACCENT_PRESET_LABELS,
  ACCENT_PRESET_STORAGE_KEY,
  ACCENT_PRESETS,
  type AccentPreset,
  applyAccentPresetToRoot,
  DEFAULT_ACCENT_PRESET,
  resolveAccentPreset,
} from '../../lib/theme/theme';

type AccentPresetSelectProps = {
  className?: string;
  compact?: boolean;
};

export function AccentPresetSelect({ className = '', compact = false }: AccentPresetSelectProps) {
  const [preset, setPreset] = useState<AccentPreset>(() => {
    if (typeof document === 'undefined') return DEFAULT_ACCENT_PRESET;
    return resolveAccentPreset(document.documentElement.dataset.atlasAccent);
  });
  const [mounted, setMounted] = useState(false);
  const id = useId();

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    let storedValue: string | null = null;
    try {
      storedValue = localStorage.getItem(ACCENT_PRESET_STORAGE_KEY);
    } catch {
      storedValue = null;
    }

    const nextPreset = resolveAccentPreset(storedValue ?? root.dataset.atlasAccent);
    setPreset(nextPreset);
    applyAccentPresetToRoot(nextPreset, root);
  }, []);

  const sizeClasses = compact
    ? 'h-8 min-w-[7.4rem] text-[10px] tracking-[0.12em] pl-2 pr-6'
    : 'h-9 min-w-[8.6rem] text-xs tracking-[0.18em] pl-2.5 pr-7';

  return (
    <div
      className={`relative inline-flex items-center rounded-full border border-[color:var(--color-border-strong)] bg-[var(--color-bg-surface-elevated)] ${sizeClasses} ${className}`.trim()}
    >
      <label htmlFor={id} className="sr-only">
        Accent preset
      </label>
      <span
        aria-hidden="true"
        className={`mr-1.5 inline-flex rounded-full bg-[var(--color-accent-solid)] ${
          compact ? 'h-2.5 w-2.5' : 'h-3 w-3'
        }`}
      />
      <select
        id={id}
        aria-label="Accent preset"
        value={preset}
        onChange={(event) => {
          const nextPreset = resolveAccentPreset(event.target.value);
          setPreset(nextPreset);
          const root = document.documentElement;
          applyAccentPresetToRoot(nextPreset, root);
          try {
            localStorage.setItem(ACCENT_PRESET_STORAGE_KEY, nextPreset);
          } catch {
            // Ignore storage failures.
          }
        }}
        className="w-full appearance-none bg-transparent pr-4 font-medium uppercase text-[color:var(--color-text-secondary)] outline-none"
      >
        {ACCENT_PRESETS.map((option) => (
          <option key={option} value={option}>
            {ACCENT_PRESET_LABELS[option]}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-2.5 border-l border-r border-t border-transparent border-t-[color:var(--color-text-muted)] ${
          compact
            ? 'top-[50%] -mt-[2px] border-l-[3px] border-r-[3px] border-t-[5px]'
            : 'top-[50%] -mt-[2px] border-l-[4px] border-r-[4px] border-t-[6px]'
        }`}
      />
      <span className="sr-only">
        {mounted ? `Current accent: ${ACCENT_PRESET_LABELS[preset]}` : ''}
      </span>
    </div>
  );
}
