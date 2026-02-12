import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildQueueItem, getOfflineCompletionQueue } from '../../../lib/habits/offlineQueue';
import { DailyCompletionPanel } from '../DailyCompletionPanel';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe('DailyCompletionPanel', () => {
  beforeEach(async () => {
    const queue = getOfflineCompletionQueue();
    await queue.hydrate();
    await queue.replaceAll([]);
  });

  it('renders a prompt when no day is selected', () => {
    render(
      <DailyCompletionPanel
        selectedDateKey={null}
        selectedLabel={null}
        habits={[]}
        initialCompletedHabitIds={[]}
        isFuture={false}
        timeZone="UTC"
      />,
    );

    expect(screen.getByText('Select a day to see scheduled habits.')).toBeInTheDocument();
  });

  it('toggles completion and calls the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: { result: { status: 'created', habitId: 'h1', date: '2026-02-05' } },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <DailyCompletionPanel
        selectedDateKey="2026-02-05"
        selectedLabel="February 5, 2026"
        habits={[{ id: 'h1', title: 'Read', description: 'Read daily' }]}
        initialCompletedHabitIds={[]}
        isFuture={false}
        timeZone="UTC"
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: /read/i });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(checkbox);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));

    vi.unstubAllGlobals();
  });

  it('disables toggles for future dates', () => {
    render(
      <DailyCompletionPanel
        selectedDateKey="2026-02-10"
        selectedLabel="February 10, 2026"
        habits={[{ id: 'h1', title: 'Read', description: null }]}
        initialCompletedHabitIds={[]}
        isFuture={true}
        timeZone="UTC"
      />,
    );

    expect(screen.getByRole('checkbox', { name: /read/i })).toBeDisabled();
    expect(screen.getByText(/future dates cannot be completed yet/i)).toBeInTheDocument();
  });

  it('rolls back optimistic updates when the request fails', async () => {
    let resolveFetch: (value: {
      ok: boolean;
      status: number;
      statusText: string;
      json: () => Promise<unknown>;
    }) => void = () => undefined;

    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    const fetchMock = vi.fn().mockReturnValue(fetchPromise);
    vi.stubGlobal('fetch', fetchMock);

    render(
      <DailyCompletionPanel
        selectedDateKey="2026-02-05"
        selectedLabel="February 5, 2026"
        habits={[{ id: 'h1', title: 'Read', description: 'Read daily' }]}
        initialCompletedHabitIds={[]}
        isFuture={false}
        timeZone="UTC"
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: /read/i });

    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    resolveFetch({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        ok: false,
        error: { code: 'invalid_request', message: 'Invalid' },
      }),
    });

    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'false'));

    vi.unstubAllGlobals();
  });

  it('moves focus between habits with arrow keys', () => {
    render(
      <DailyCompletionPanel
        selectedDateKey="2026-02-05"
        selectedLabel="February 5, 2026"
        habits={[
          { id: 'h1', title: 'Read', description: null },
          { id: 'h2', title: 'Walk', description: null },
        ]}
        initialCompletedHabitIds={[]}
        isFuture={false}
        timeZone="UTC"
      />,
    );

    const read = screen.getByRole('checkbox', { name: /read/i });
    const walk = screen.getByRole('checkbox', { name: /walk/i });

    read.focus();
    expect(read).toHaveFocus();

    fireEvent.keyDown(read, { key: 'ArrowDown' });
    expect(walk).toHaveFocus();

    fireEvent.keyDown(walk, { key: 'ArrowUp' });
    expect(read).toHaveFocus();
  });

  it('shows a pending indicator for offline completions', async () => {
    const queue = getOfflineCompletionQueue();
    await queue.hydrate();
    await queue.replaceAll([
      buildQueueItem({
        habitId: 'h1',
        dateKey: '2026-02-05',
        completed: true,
        now: new Date('2026-02-05T10:00:00.000Z'),
      }),
    ]);

    render(
      <DailyCompletionPanel
        selectedDateKey="2026-02-05"
        selectedLabel="February 5, 2026"
        habits={[{ id: 'h1', title: 'Read', description: 'Read daily' }]}
        initialCompletedHabitIds={[]}
        isFuture={false}
        timeZone="UTC"
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: /read/i });
    await waitFor(() => expect(checkbox).toHaveAttribute('data-pending', 'true'));
    expect(within(checkbox).getByText(/pending sync/i)).toBeInTheDocument();
  });
});
