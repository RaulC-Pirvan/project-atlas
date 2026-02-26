import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminActivityPanel } from '../AdminActivityPanel';
import { AdminConversionPanel } from '../AdminConversionPanel';
import { AdminExportPanel } from '../AdminExportPanel';
import { AdminHabitsPanel } from '../AdminHabitsPanel';
import { AdminHealthPanel } from '../AdminHealthPanel';
import { AdminSupportPanel } from '../AdminSupportPanel';
import { AdminUsersPanel } from '../AdminUsersPanel';

describe('admin panels', () => {
  it('renders health status from the admin endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          status: 'ok',
          timestamp: '2026-02-03T00:00:00.000Z',
          uptimeSeconds: 125,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminHealthPanel />);

    expect(await screen.findByText('ok')).toBeInTheDocument();
    expect(screen.getByText('2m 5s')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('renders users from the admin users endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          users: [
            {
              email: 'user@example.com',
              displayName: 'User Example',
              emailVerifiedAt: null,
              createdAt: '2026-02-01T00:00:00.000Z',
              deletedAt: null,
            },
          ],
          counts: { total: 1, verified: 0, unverified: 1 },
          nextCursor: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminUsersPanel />);

    expect(await screen.findByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText(/1 total/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('renders habits from the admin habits endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          habits: [
            {
              title: 'Read',
              description: 'Read daily',
              archivedAt: null,
              createdAt: '2026-02-01T00:00:00.000Z',
              scheduleSummary: 'Mon, Wed',
              weekdays: [1, 3],
              user: { email: 'user@example.com', displayName: 'User Example' },
            },
          ],
          counts: { total: 1, active: 1, archived: 0 },
          nextCursor: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminHabitsPanel />);

    expect(await screen.findByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Mon, Wed')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('renders activity entries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          entries: [
            {
              id: 'log-1',
              timestamp: '2026-02-03T00:00:00.000Z',
              level: 'info',
              message: 'api.request',
              method: 'GET',
              route: '/api/health',
              status: 200,
              durationMs: 12,
            },
          ],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminActivityPanel />);

    expect(await screen.findByText('API request')).toBeInTheDocument();
    expect(screen.getByText('GET | /api/health | 200 | 12ms')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('renders support tickets from the admin support endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          tickets: [
            {
              id: 'ticket-1',
              category: 'bug',
              status: 'open',
              name: 'Atlas User',
              subject: 'Cannot save habit',
              message: 'The save button does nothing when I submit my updated habit schedule.',
              email: 'user@example.com',
              createdAt: '2026-02-19T00:00:00.000Z',
              updatedAt: '2026-02-19T00:00:00.000Z',
              inProgressAt: null,
              resolvedAt: null,
            },
          ],
          counts: { total: 1, open: 1, inProgress: 0, resolved: 0 },
          nextCursor: null,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminSupportPanel />);

    expect(await screen.findByText('Cannot save habit')).toBeInTheDocument();
    expect(screen.getByText(/atlas user \| user@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/save button does nothing/i)).toBeInTheDocument();
    expect(screen.getByText(/1 total/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('renders export actions', () => {
    render(<AdminExportPanel />);

    expect(screen.getByText(/download users csv/i)).toBeInTheDocument();
    expect(screen.getByText(/download habits csv/i)).toBeInTheDocument();
  });

  it('renders conversion KPI cards from the admin conversion endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          summary: {
            generatedAt: '2026-02-26T00:00:00.000Z',
            range: { startDate: '2026-02-20', endDate: '2026-02-26', dayCount: 7 },
            baselineRange: { startDate: '2026-02-13', endDate: '2026-02-19', dayCount: 7 },
            compareWithBaseline: true,
            coverage: { partial: false, reasons: [] },
            kpis: [
              {
                id: 'landing_to_first_completion',
                label: 'Landing -> First Completion Rate',
                formula:
                  'unique_users(habit_first_completion_recorded) / unique_users(landing_page_view)',
                sourceOfTruth: 'analytics.funnel',
                numeratorEvent: 'habit_first_completion_recorded',
                denominatorEvent: 'landing_page_view',
                numeratorUsers: 10,
                denominatorUsers: 20,
                rate: 0.5,
                baselineRate: 0.4,
                deltaRate: 0.1,
                status: 'ok',
              },
            ],
            transitions: [
              {
                id: 'landing_to_signup',
                label: 'Landing -> Signup',
                fromEvent: 'landing_page_view',
                toEvent: 'auth_sign_up_completed',
                fromUsers: 20,
                toUsers: 12,
                transitionedUsers: 10,
                rate: 0.5,
                baselineTransitionedUsers: 8,
                baselineRate: 0.44,
              },
            ],
            events: [
              {
                event: 'landing_page_view',
                users: 20,
                events: 25,
                baselineUsers: 18,
                baselineEvents: 19,
              },
            ],
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminConversionPanel />);

    expect(
      (await screen.findAllByText(/landing -> first completion rate/i)).length,
    ).toBeGreaterThan(0);
    expect((await screen.findAllByText('50.0%')).length).toBeGreaterThan(0);
    expect(screen.getByText(/funnel transitions \(read-only\)/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/landing -> signup/i)).length).toBeGreaterThan(0);
    expect(screen.getByText(/compare baseline period/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('starts export downloads when buttons are clicked', () => {
    const locationMock = { href: 'http://localhost' } as Location & { href: string };
    Object.defineProperty(window, 'location', {
      value: locationMock,
      writable: true,
    });

    render(<AdminExportPanel />);

    screen.getByRole('button', { name: /download users csv/i }).click();
    expect(window.location.href).toBe('/api/admin/exports/users');

    screen.getByRole('button', { name: /download habits csv/i }).click();
    expect(window.location.href).toBe('/api/admin/exports/habits');
  });
});
