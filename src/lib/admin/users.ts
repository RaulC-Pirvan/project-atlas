import { ApiError } from '../api/errors';

type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  emailVerified: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
};

type AdminUserClient = {
  user: {
    findMany: (args: {
      where?: Record<string, unknown>;
      orderBy: Array<{ createdAt?: 'desc' | 'asc'; id?: 'desc' | 'asc' }>;
      take: number;
      skip?: number;
      cursor?: { id: string };
      select: {
        id: true;
        email: true;
        displayName: true;
        emailVerified: true;
        createdAt: true;
        deletedAt: true;
      };
    }) => Promise<UserRecord[]>;
    count: (args: { where?: Record<string, unknown> }) => Promise<number>;
  };
};

export type AdminUserSummary = {
  email: string;
  displayName: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
};

export type AdminUserCounts = {
  total: number;
  verified: number;
  unverified: number;
};

export type AdminUserListResult = {
  users: AdminUserSummary[];
  counts: AdminUserCounts;
  nextCursor: string | null;
};

type ListAdminUsersArgs = {
  prisma: AdminUserClient;
  search?: string | null;
  cursor?: string | null;
  take?: number | null;
  includeDeleted?: boolean;
};

function normalizeLimit(value?: number | null): number {
  if (!value || Number.isNaN(value)) return 20;
  const coerced = Math.floor(value);
  if (coerced < 1) return 1;
  if (coerced > 100) return 100;
  return coerced;
}

function buildSearchFilter(search?: string | null): Record<string, unknown> {
  const trimmed = search?.trim();
  if (!trimmed) return {};

  return {
    OR: [
      { email: { contains: trimmed, mode: 'insensitive' } },
      { displayName: { contains: trimmed, mode: 'insensitive' } },
    ],
  };
}

function toSummary(user: UserRecord): AdminUserSummary {
  return {
    email: user.email,
    displayName: user.displayName,
    emailVerifiedAt: user.emailVerified,
    createdAt: user.createdAt,
    deletedAt: user.deletedAt,
  };
}

export async function listAdminUsers({
  prisma,
  search,
  cursor,
  take,
  includeDeleted = false,
}: ListAdminUsersArgs): Promise<AdminUserListResult> {
  const limit = normalizeLimit(take);
  const baseWhere: Record<string, unknown> = {
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...buildSearchFilter(search),
  };

  const [total, verified] = await Promise.all([
    prisma.user.count({ where: baseWhere }),
    prisma.user.count({ where: { ...baseWhere, emailVerified: { not: null } } }),
  ]);

  if (verified > total) {
    throw new ApiError('internal_error', 'User counts out of range.', 500);
  }

  const users = await prisma.user.findMany({
    where: baseWhere,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      email: true,
      displayName: true,
      emailVerified: true,
      createdAt: true,
      deletedAt: true,
    },
  });

  const hasNext = users.length > limit;
  const sliced = hasNext ? users.slice(0, limit) : users;
  const nextCursor = hasNext ? (sliced[sliced.length - 1]?.id ?? null) : null;

  return {
    users: sliced.map(toSummary),
    counts: {
      total,
      verified,
      unverified: total - verified,
    },
    nextCursor,
  };
}
