type PrismaClientLike = {
  session: {
    deleteMany: (args: {
      where:
        | { userId: string }
        | {
            userId: string;
            sessionToken: { not: string };
          };
    }) => Promise<{ count: number }>;
  };
};

type RevokeAllUserSessionsArgs = {
  prisma: PrismaClientLike;
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
