'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import { createSupportTicketSchema } from '../../lib/api/support/validation';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { ThemeToggle } from '../ui/ThemeToggle';
import { type ToastItem, ToastStack } from '../ui/Toast';

type SupportCenterProps = {
  initialName: string;
  initialEmail: string;
  isAuthenticated: boolean;
};

type SupportSubmitResponse = {
  accepted: true;
};

const FAQ_ITEMS = [
  {
    question: 'What should I include to get faster help?',
    answer:
      'Add exact steps, expected behavior, and what happened. For billing questions, include the purchase email you used.',
  },
  {
    question: 'Do I need an account to contact support?',
    answer:
      'No. The support center is public, so you can submit billing, account, bug, and feature requests while signed out.',
  },
  {
    question: 'How long does support take to reply?',
    answer:
      'We target first responses within 2 business days for most requests. Timing can vary based on queue volume and issue complexity.',
  },
  {
    question: 'What happens after I submit a request?',
    answer:
      'Your request is saved to our support queue and sent to our support inbox for triage. We reply by email when follow-up is needed.',
  },
  {
    question: 'Can I update old habits after the grace window?',
    answer:
      'No. Atlas allows yesterday check-ins only until 02:00 local time; older dates stay locked to keep history consistent and timezone-safe.',
  },
  {
    question: 'Can support restore a deleted account?',
    answer:
      'No. Deleting your account from Account settings permanently removes it and cannot be reversed.',
  },
] as const;

const SUPPORT_CATEGORIES = [
  { value: 'billing', label: 'Billing' },
  { value: 'account', label: 'Account' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature request' },
] as const;

type SupportField = 'name' | 'email' | 'category' | 'subject' | 'message';

const EMPTY_INVALID_FIELDS: Record<SupportField, boolean> = {
  name: false,
  email: false,
  category: false,
  subject: false,
  message: false,
};

const FIELD_LABELS: Record<SupportField, string> = {
  name: 'Name',
  email: 'Email',
  category: 'Category',
  subject: 'Subject',
  message: 'Message',
};

const invalidControlClasses =
  'border-red-500 focus-visible:ring-red-500 dark:border-red-400 dark:focus-visible:ring-red-400';

function isSupportField(value: string): value is SupportField {
  return (
    value === 'name' ||
    value === 'email' ||
    value === 'category' ||
    value === 'subject' ||
    value === 'message'
  );
}

export function SupportCenter({ initialName, initialEmail, isAuthenticated }: SupportCenterProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [category, setCategory] = useState<(typeof SUPPORT_CATEGORIES)[number]['value']>('account');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [invalidFields, setInvalidFields] =
    useState<Record<SupportField, boolean>>(EMPTY_INVALID_FIELDS);
  const toastIdRef = useRef(0);

  const homeHref = useMemo(() => (isAuthenticated ? '/today' : '/landing'), [isAuthenticated]);
  const homeLabel = isAuthenticated ? 'Dashboard' : 'Home';

  const pushToast = (text: string, tone: ToastItem['tone'] = 'neutral') => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((prev) => [...prev, { id, tone, message: text, state: 'entering' }]);

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

  const clearInvalidField = (field: SupportField) => {
    setInvalidFields((previous) => {
      if (!previous[field]) {
        return previous;
      }
      return { ...previous, [field]: false };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const payload = {
      name,
      email,
      category,
      subject,
      message,
      honeypot,
      captchaToken: captchaToken || undefined,
    };

    const parsed = createSupportTicketSchema.safeParse(payload);
    if (!parsed.success) {
      const nextInvalidFields: Record<SupportField, boolean> = { ...EMPTY_INVALID_FIELDS };
      let firstFieldError: string | null = null;

      for (const issue of parsed.error.issues) {
        const firstPathSegment = issue.path[0];
        if (typeof firstPathSegment !== 'string' || !isSupportField(firstPathSegment)) {
          continue;
        }

        nextInvalidFields[firstPathSegment] = true;
        if (!firstFieldError) {
          firstFieldError = `${FIELD_LABELS[firstPathSegment]}: ${issue.message}`;
        }
      }

      setInvalidFields(nextInvalidFields);
      pushToast(
        firstFieldError ?? 'Please complete all required support fields correctly.',
        'error',
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = await parseJson<SupportSubmitResponse>(response);
      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setSubject('');
      setMessage('');
      setHoneypot('');
      setCaptchaToken('');
      setInvalidFields({ ...EMPTY_INVALID_FIELDS });
      pushToast('Support request sent. We will get back to you soon.', 'success');
    } catch {
      pushToast('Support request could not be sent right now. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14">
        <header className="flex items-center justify-between opacity-0 translate-y-2 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.5s_ease-out_forwards]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/60 dark:text-white/60">
            Project Atlas
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={homeHref}
              className="text-xs font-medium uppercase tracking-[0.2em] text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white"
            >
              {homeLabel}
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="mt-10 space-y-3 opacity-0 translate-y-2 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.5s_ease-out_forwards] motion-safe:[animation-delay:120ms]">
          <h1 className="text-3xl font-semibold tracking-tight">Support center</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-black/65 dark:text-white/65">
            Use this form for billing, account, bug, or feature questions. Include enough detail so
            we can help without back-and-forth.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 text-sm text-black/75 dark:border-white/10 dark:bg-black dark:text-white/75">
          <h2 className="text-base font-semibold">Response expectations</h2>
          <p className="mt-2 leading-relaxed">
            We target first responses within 2 business days for most requests. Timing can vary with
            queue volume and issue complexity.
          </p>
          <p className="mt-2 leading-relaxed">
            Fastest path: include exact steps, expected behavior, actual behavior, and any purchase
            details (email, platform, order info) for billing cases.
          </p>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 opacity-0 translate-y-2 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.55s_ease-out_forwards] motion-safe:[animation-delay:220ms] dark:border-white/10 dark:bg-black">
            <h2 className="text-lg font-semibold">FAQ</h2>
            <ul className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <li key={item.question} className="space-y-2">
                  <p className="text-sm font-medium">{item.question}</p>
                  <p className="text-sm leading-relaxed text-black/65 dark:text-white/65">
                    {item.answer}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section
            id="contact-form"
            className="scroll-mt-6 rounded-3xl border border-black/10 bg-white p-6 opacity-0 translate-y-2 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-safe:animate-[rise-in_0.55s_ease-out_forwards] motion-safe:[animation-delay:320ms] dark:border-white/10 dark:bg-black"
          >
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="support-name" label="Name" error={null}>
                  <Input
                    id="support-name"
                    value={name}
                    autoComplete="name"
                    aria-invalid={invalidFields.name}
                    className={invalidFields.name ? invalidControlClasses : ''}
                    onChange={(event) => {
                      setName(event.target.value);
                      clearInvalidField('name');
                    }}
                  />
                </FormField>
                <FormField id="support-email" label="Email" error={null}>
                  <Input
                    id="support-email"
                    value={email}
                    type="email"
                    autoComplete="email"
                    aria-invalid={invalidFields.email}
                    className={invalidFields.email ? invalidControlClasses : ''}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearInvalidField('email');
                    }}
                  />
                </FormField>
              </div>

              <FormField id="support-category" label="Category" error={null}>
                <select
                  id="support-category"
                  value={category}
                  aria-invalid={invalidFields.category}
                  onChange={(event) => {
                    setCategory(event.target.value as (typeof SUPPORT_CATEGORIES)[number]['value']);
                    clearInvalidField('category');
                  }}
                  className={`h-11 w-full rounded-full border border-black/15 bg-white px-4 text-sm text-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/15 dark:bg-black dark:text-white dark:focus-visible:ring-white/25 ${
                    invalidFields.category ? invalidControlClasses : ''
                  }`.trim()}
                >
                  {SUPPORT_CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField id="support-subject" label="Subject" error={null}>
                <Input
                  id="support-subject"
                  value={subject}
                  aria-invalid={invalidFields.subject}
                  className={invalidFields.subject ? invalidControlClasses : ''}
                  onChange={(event) => {
                    setSubject(event.target.value);
                    clearInvalidField('subject');
                  }}
                />
              </FormField>

              <FormField
                id="support-message"
                label="Message"
                hint="Include steps to reproduce, expected behavior, and what happened."
                error={null}
              >
                <textarea
                  id="support-message"
                  value={message}
                  aria-invalid={invalidFields.message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    clearInvalidField('message');
                  }}
                  rows={8}
                  className={`w-full resize-y rounded-3xl border border-black/15 bg-white px-4 py-3 text-sm text-black placeholder:text-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/40 dark:focus-visible:ring-white/25 ${
                    invalidFields.message ? invalidControlClasses : ''
                  }`.trim()}
                />
              </FormField>

              <input
                type="text"
                name="atlas-check"
                autoComplete="off"
                tabIndex={-1}
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
                className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
                aria-hidden="true"
              />
              <input
                type="hidden"
                name="captchaToken"
                value={captchaToken}
                onChange={(event) => setCaptchaToken(event.target.value)}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Sending request...' : 'Send support request'}
              </Button>
            </form>
          </section>
        </div>
      </div>

      <ToastStack toasts={toasts} />
    </main>
  );
}
