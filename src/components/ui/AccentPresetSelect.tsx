'use client';

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

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

const ACCENT_PRESET_SWATCH_COLORS: Record<AccentPreset, string> = {
  gold: '#FAB95B',
  green: '#34C759',
  blue: '#3B82F6',
  pink: '#EC4899',
  red: '#EF4444',
};

export function AccentPresetSelect({ className = '', compact = false }: AccentPresetSelectProps) {
  const [preset, setPreset] = useState<AccentPreset>(DEFAULT_ACCENT_PRESET);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Record<AccentPreset, HTMLButtonElement | null>>({
    gold: null,
    green: null,
    blue: null,
    pink: null,
    red: null,
  });

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

  useEffect(() => {
    if (!isOpen) return;

    optionRefs.current[preset]?.focus();

    const isEventWithinRoot = (event: PointerEvent, root: HTMLElement | null): boolean => {
      if (!root) return false;

      try {
        if (typeof event.composedPath === 'function') {
          const path = event.composedPath();
          if (path.includes(root)) {
            return true;
          }
        }
      } catch {
        // Ignore composedPath access failures from restricted targets.
      }

      try {
        const target = event.target;
        return target instanceof Node ? root.contains(target) : false;
      } catch {
        // Firefox can throw permission-denied for extension-injected SVG targets.
        return false;
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!isEventWithinRoot(event, rootRef.current)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, preset]);

  const applyPreset = (value: string) => {
    const nextPreset = resolveAccentPreset(value);
    setPreset(nextPreset);
    const root = document.documentElement;
    applyAccentPresetToRoot(nextPreset, root);
    try {
      localStorage.setItem(ACCENT_PRESET_STORAGE_KEY, nextPreset);
    } catch {
      // Ignore storage failures.
    }
  };

  const handleOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    option: AccentPreset,
  ) => {
    if (
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }

    event.preventDefault();
    const currentIndex = ACCENT_PRESETS.indexOf(option);
    if (currentIndex < 0) return;

    if (event.key === 'Home') {
      optionRefs.current[ACCENT_PRESETS[0]]?.focus();
      return;
    }

    if (event.key === 'End') {
      optionRefs.current[ACCENT_PRESETS[ACCENT_PRESETS.length - 1]]?.focus();
      return;
    }

    const delta = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + delta + ACCENT_PRESETS.length) % ACCENT_PRESETS.length;
    optionRefs.current[ACCENT_PRESETS[nextIndex]]?.focus();
  };

  const sizeClasses = compact
    ? 'h-8 min-w-[7.4rem] text-[10px] tracking-[0.12em] pl-2 pr-6'
    : 'h-9 min-w-[8.6rem] text-xs tracking-[0.18em] pl-2.5 pr-7';

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex items-center rounded-full border border-[color:var(--color-border-strong)] bg-[var(--color-bg-surface-elevated)] ${sizeClasses} ${className}`.trim()}
    >
      <label id={`${id}-label`} htmlFor={id} className="sr-only">
        Accent preset
      </label>
      <button
        id={id}
        type="button"
        aria-label="Accent preset"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        onClick={() => setIsOpen((previous) => !previous)}
        className="inline-flex h-full w-full items-center pr-4 font-medium uppercase text-[color:var(--color-text-secondary)] outline-none"
      >
        <span
          aria-hidden="true"
          className={`mr-1.5 inline-flex rounded-full ${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`}
          style={{ backgroundColor: ACCENT_PRESET_SWATCH_COLORS[preset] }}
        />
        <span>{ACCENT_PRESET_LABELS[preset]}</span>
      </button>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-2.5 border-l border-r border-t border-transparent border-t-[color:var(--color-text-muted)] transition-transform ${
          compact
            ? 'top-[50%] -mt-[2px] border-l-[3px] border-r-[3px] border-t-[5px]'
            : 'top-[50%] -mt-[2px] border-l-[4px] border-r-[4px] border-t-[6px]'
        } ${isOpen ? 'rotate-180' : ''}`}
      />
      <span className="sr-only">
        {mounted ? `Current accent: ${ACCENT_PRESET_LABELS[preset]}` : ''}
      </span>

      {isOpen ? (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label="Accent preset options"
          className="absolute left-0 top-[calc(100%+0.35rem)] z-30 min-w-full rounded-2xl border border-[color:var(--color-border-strong)] bg-[var(--color-bg-surface-elevated)] p-1 shadow-[0_14px_28px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_30px_rgba(0,0,0,0.5)]"
        >
          {ACCENT_PRESETS.map((option) => {
            const selected = option === preset;

            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                ref={(element) => {
                  optionRefs.current[option] = element;
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left font-medium uppercase transition ${
                  compact ? 'text-[10px] tracking-[0.12em]' : 'text-xs tracking-[0.18em]'
                } ${
                  selected
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-[color:var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                onClick={() => {
                  applyPreset(option);
                  setIsOpen(false);
                }}
                onKeyDown={(event) => handleOptionKeyDown(event, option)}
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex rounded-full ${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'}`}
                  style={{ backgroundColor: ACCENT_PRESET_SWATCH_COLORS[option] }}
                />
                <span>{ACCENT_PRESET_LABELS[option]}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
