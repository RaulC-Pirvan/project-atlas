import { getServerSession } from 'next-auth/next';

import { requireAdminSession } from '../../../../../../lib/admin/auth';
import { ApiError, asApiError } from '../../../../../../lib/api/errors';
import { jsonError, jsonOk } from '../../../../../../lib/api/response';
import { authOptions } from '../../../../../../lib/auth/nextauth';
import { recordAdminLog } from '../../../../../../lib/observability/adminLogStore';
import { withApiLogging } from '../../../../../../lib/observability/apiLogger';

export const runtime = 'nodejs';

type SeedMessage = 'analytics.funnel' | 'analytics.pro_conversion';

type SeedEvent = {
  message: SeedMessage;
  event:
    | 'landing_page_view'
    | 'auth_sign_up_completed'
    | 'auth_sign_in_completed'
    | 'habit_first_created'
    | 'habit_first_completion_recorded'
    | 'pro_page_view'
    | 'pro_checkout_initiated'
    | 'pro_checkout_return'
    | 'pro_entitlement_active';
  surface: string;
  users: string[];
  duplicateUsers?: string[];
};

type SeedStats = {
  totalEvents: number;
  baselineEvents: number;
  activeEvents: number;
};

function assertTestMode() {
  if (process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
    throw new ApiError('not_found', 'Not found.', 404);
  }
}

function createUserIds(prefix: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_value, index) => `${prefix}${String(index + 1).padStart(2, '0')}`,
  );
}

function pickUsers(pool: string[], indices: number[]): string[] {
  const selected: string[] = [];
  for (const index of indices) {
    const value = pool[index];
    if (value) {
      selected.push(value);
    }
  }
  return selected;
}

function toSeedTimestamp(now: Date, dayOffset: number, sequence: number): string {
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + dayOffset,
      9 + (sequence % 10),
      (sequence * 7) % 60,
      0,
      0,
    ),
  ).toISOString();
}

function createSeedEvents(users: string[], bucket: 'baseline' | 'active'): SeedEvent[] {
  const landingUsers = users;
  const signupUsers = users.slice(0, bucket === 'active' ? 8 : 6);
  const firstHabitUsers = users.slice(0, bucket === 'active' ? 6 : 4);
  const firstCompletionUsers = users.slice(0, bucket === 'active' ? 4 : 2);
  const signInUsers = pickUsers(users, bucket === 'active' ? [1, 5, 10, 11] : [2, 6, 8]);
  const proPageUsers = pickUsers(
    users,
    bucket === 'active' ? [0, 1, 2, 3, 8, 9, 11] : [0, 1, 2, 3, 4],
  );
  const checkoutUsers = pickUsers(users, bucket === 'active' ? [0, 1, 2, 8] : [0, 1]);
  const checkoutReturnUsers = pickUsers(users, bucket === 'active' ? [0, 1, 8] : [0, 1]);
  const entitlementUsers = pickUsers(users, bucket === 'active' ? [0, 1] : [0]);

  return [
    {
      message: 'analytics.funnel',
      event: 'landing_page_view',
      surface: '/landing',
      users: landingUsers,
      duplicateUsers: landingUsers.slice(0, 3),
    },
    {
      message: 'analytics.funnel',
      event: 'auth_sign_up_completed',
      surface: '/api/auth/signup',
      users: signupUsers,
    },
    {
      message: 'analytics.funnel',
      event: 'auth_sign_in_completed',
      surface: '/api/auth/sign-in',
      users: signInUsers,
    },
    {
      message: 'analytics.funnel',
      event: 'habit_first_created',
      surface: '/api/habits',
      users: firstHabitUsers,
    },
    {
      message: 'analytics.funnel',
      event: 'habit_first_completion_recorded',
      surface: '/api/completions',
      users: firstCompletionUsers,
    },
    {
      message: 'analytics.pro_conversion',
      event: 'pro_page_view',
      surface: '/pro',
      users: proPageUsers,
      duplicateUsers: proPageUsers.slice(0, 2),
    },
    {
      message: 'analytics.pro_conversion',
      event: 'pro_checkout_initiated',
      surface: '/api/billing/stripe/checkout',
      users: checkoutUsers,
    },
    {
      message: 'analytics.pro_conversion',
      event: 'pro_checkout_return',
      surface: '/account',
      users: checkoutReturnUsers,
    },
    {
      message: 'analytics.pro_conversion',
      event: 'pro_entitlement_active',
      surface: '/api/billing/stripe/webhook',
      users: entitlementUsers,
    },
  ];
}

function recordSeedBucket(
  now: Date,
  args: { users: string[]; startDayOffset: number; bucket: 'baseline' | 'active' },
): number {
  let count = 0;
  const eventDefinitions = createSeedEvents(args.users, args.bucket);

  for (const definition of eventDefinitions) {
    const eventUsers = [...definition.users, ...(definition.duplicateUsers ?? [])];

    for (let index = 0; index < eventUsers.length; index += 1) {
      const userId = eventUsers[index];
      recordAdminLog({
        timestamp: toSeedTimestamp(now, args.startDayOffset + (index % 7), index),
        level: 'info',
        message: definition.message,
        schemaVersion: 1,
        event: definition.event,
        surface: definition.surface,
        authenticated: true,
        userId,
      });
      count += 1;
    }
  }

  return count;
}

function seedConversionLogs(now: Date): SeedStats {
  const baselineUsers = createUserIds('baseline_user_', 10);
  const activeUsers = createUserIds('active_user_', 12);

  const baselineEvents = recordSeedBucket(now, {
    users: baselineUsers,
    startDayOffset: -13,
    bucket: 'baseline',
  });
  const activeEvents = recordSeedBucket(now, {
    users: activeUsers,
    startDayOffset: -6,
    bucket: 'active',
  });

  return {
    totalEvents: baselineEvents + activeEvents,
    baselineEvents,
    activeEvents,
  };
}

export async function POST(request: Request) {
  return withApiLogging(
    request,
    { route: '/api/admin/debug/conversion/seed' },
    async () => {
      assertTestMode();

      const session = await getServerSession(authOptions);
      await requireAdminSession(session);

      const now = new Date();
      const seeded = seedConversionLogs(now);

      return jsonOk({
        seededAt: now.toISOString(),
        seeded,
      });
    },
    (error) => {
      const apiError = asApiError(error);
      return { response: jsonError(apiError), errorCode: apiError.code };
    },
  );
}
