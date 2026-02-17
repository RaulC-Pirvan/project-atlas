export type ManagedSessionRecord = {
  id: string;
  sessionToken: string;
  expires: Date;
  lastActiveAt: Date;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

type PrismaDeleteManyLike = {
  session: {
    deleteMany: (args: {
      where:
        | { userId: string }
        | {
            userId: string;
            sessionToken: { not: string };
          }
        | {
            id: string;
            userId: string;
          };
    }) => Promise<{ count: number }>;
  };
};

type PrismaListSessionsLike = {
  session: {
    findMany: (args: {
      where: {
        userId: string;
        expires: { gt: Date };
      };
      orderBy: { lastActiveAt: 'desc' };
      select: {
        id: true;
        sessionToken: true;
        expires: true;
        lastActiveAt: true;
        createdAt: true;
        ipAddress: true;
        userAgent: true;
      };
    }) => Promise<ManagedSessionRecord[]>;
  };
};

type PrismaFindSessionLike = {
  session: {
    findFirst: (args: {
      where: {
        id: string;
        userId: string;
      };
      select: {
        id: true;
        sessionToken: true;
      };
    }) => Promise<{ id: string; sessionToken: string } | null>;
  };
};

type RevokeAllUserSessionsArgs = {
  prisma: PrismaDeleteManyLike;
  userId: string;
  exceptSessionToken?: string | null;
};

export async function revokeAllUserSessions({
  prisma,
  userId,
  exceptSessionToken = null,
}: RevokeAllUserSessionsArgs): Promise<{ revokedCount: number }> {
  const result = await prisma.session.deleteMany({
    where: exceptSessionToken
      ? {
          userId,
          sessionToken: { not: exceptSessionToken },
        }
      : { userId },
  });

  return { revokedCount: result.count };
}

type RevokeUserSessionByIdArgs = {
  prisma: PrismaDeleteManyLike;
  userId: string;
  sessionId: string;
};

export async function revokeUserSessionById({
  prisma,
  userId,
  sessionId,
}: RevokeUserSessionByIdArgs): Promise<{ revokedCount: number }> {
  const result = await prisma.session.deleteMany({
    where: {
      id: sessionId,
      userId,
    },
  });

  return { revokedCount: result.count };
}

type ListActiveUserSessionsArgs = {
  prisma: PrismaListSessionsLike;
  userId: string;
  now?: Date;
};

export async function listActiveUserSessions({
  prisma,
  userId,
  now = new Date(),
}: ListActiveUserSessionsArgs): Promise<ManagedSessionRecord[]> {
  return prisma.session.findMany({
    where: {
      userId,
      expires: { gt: now },
    },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      sessionToken: true,
      expires: true,
      lastActiveAt: true,
      createdAt: true,
      ipAddress: true,
      userAgent: true,
    },
  });
}

type FindUserSessionByIdArgs = {
  prisma: PrismaFindSessionLike;
  userId: string;
  sessionId: string;
};

export async function findUserSessionById({
  prisma,
  userId,
  sessionId,
}: FindUserSessionByIdArgs): Promise<{ id: string; sessionToken: string } | null> {
  return prisma.session.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    select: {
      id: true,
      sessionToken: true,
    },
  });
}
