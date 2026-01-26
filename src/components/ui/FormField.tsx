import type { ReactNode } from 'react';

import { Label } from './Label';

type FormFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
};

export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-black/50">{hint}</p> : null}
      {error ? <p className="text-xs font-medium text-black">{error}</p> : null}
    </div>
  );
}
