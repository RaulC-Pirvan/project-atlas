import { AccentPresetSelect } from './AccentPresetSelect';
import { ThemeToggle } from './ThemeToggle';

type ThemeControlsProps = {
  className?: string;
  compact?: boolean;
  showAccentPresetSelect?: boolean;
};

export function ThemeControls({
  className = '',
  compact = false,
  showAccentPresetSelect = false,
}: ThemeControlsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      {showAccentPresetSelect ? <AccentPresetSelect compact={compact} /> : null}
      <ThemeToggle className={compact ? 'h-8 w-8' : ''} />
    </div>
  );
}
