import { AccentPresetSelect } from './AccentPresetSelect';
import { ThemeToggle } from './ThemeToggle';

type ThemeControlsProps = {
  className?: string;
  compact?: boolean;
};

export function ThemeControls({ className = '', compact = false }: ThemeControlsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <AccentPresetSelect compact={compact} />
      <ThemeToggle className={compact ? 'h-8 w-8' : ''} />
    </div>
  );
}
