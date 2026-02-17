import { getClientIp } from '../http/rateLimit';
import { AUTH_SESSION_MAX_AGE_SECONDS } from './sessionConfig';
import { generateToken } from './tokens';

type PrismaClientLike = {
  session: {
    create: (args: {
      data: {
        sessionToken: string;
        userId: string;
        expires: Date;
        lastActiveAt?: Date;
        ipAddress?: string | null;
        userAgent?: string | null;
      };
    }) => Promise<{ id: string; sessionToken: string; expires: Date }>;
    deleteMany: (args: { where: { sessionToken: string } }) => Promise<{ count: number }>;
  };
};

type CreateDatabaseSessionArgs = {
  prisma: PrismaClientLike;
  userId: string;
  request: Request;
  now?: Date;
};

type DatabaseSession = {
  sessionToken: string;
  expires: Date;
};

export async function createDatabaseSession({
  prisma,
  userId,
  request,
  now = new Date(),
}: CreateDatabaseSessionArgs): Promise<DatabaseSession> {
  const sessionToken = generateToken(32);
  const expires = new Date(now.getTime() + AUTH_SESSION_MAX_AGE_SECONDS * 1000);
  const ipAddress = getClientIp(request);
  const userAgent = request.headers.get('user-agent')?.trim() || null;

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
      lastActiveAt: now,
      ipAddress,
      userAgent,
    },
  });

  return { sessionToken, expires };
}

export async function revokeDatabaseSessionByToken(prisma: PrismaClientLike, sessionToken: string) {
  return prisma.session.deleteMany({ where: { sessionToken } });
}
