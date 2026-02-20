import {
  USER_DATA_EXPORT_FORMAT,
  type UserDataExportFormat,
  type UserDataExportRecordCounts,
} from './types';

type UserDataExportAuditStatus = 'success' | 'failure';

type UserDataExportAuditCreateInput = {
  userId: string;
  requestedAt: Date;
  status: UserDataExportAuditStatus;
  format: UserDataExportFormat;
  recordCounts: UserDataExportRecordCounts | null;
  requestId: string;
  errorCode?: string | null;
};

type UserDataExportAuditClient = {
  userDataExportAudit: {
    create: (args: { data: UserDataExportAuditCreateInput }) => Promise<unknown>;
  };
};

type UserDataExportAuditBaseArgs = {
  prisma: UserDataExportAuditClient;
  userId: string;
  requestId: string;
  format?: UserDataExportFormat;
  requestedAt?: Date;
};

type CreateUserDataExportAuditSuccessArgs = UserDataExportAuditBaseArgs & {
  recordCounts: UserDataExportRecordCounts;
};

type CreateUserDataExportAuditFailureArgs = UserDataExportAuditBaseArgs & {
  recordCounts?: UserDataExportRecordCounts | null;
  errorCode?: string | null;
};

function normalizeRequestId(requestId: string): string {
  const trimmed = requestId.trim();
  if (trimmed.length === 0) return 'unknown';
  return trimmed.slice(0, 128);
}

export async function createUserDataExportAuditSuccess(
  args: CreateUserDataExportAuditSuccessArgs,
): Promise<void> {
  await args.prisma.userDataExportAudit.create({
    data: {
      userId: args.userId,
      requestedAt: args.requestedAt ?? new Date(),
      status: 'success',
      format: args.format ?? USER_DATA_EXPORT_FORMAT,
      recordCounts: args.recordCounts,
      requestId: normalizeRequestId(args.requestId),
      errorCode: null,
    },
  });
}

export async function createUserDataExportAuditFailure(
  args: CreateUserDataExportAuditFailureArgs,
): Promise<void> {
  await args.prisma.userDataExportAudit.create({
    data: {
      userId: args.userId,
      requestedAt: args.requestedAt ?? new Date(),
      status: 'failure',
      format: args.format ?? USER_DATA_EXPORT_FORMAT,
      recordCounts: args.recordCounts ?? null,
      requestId: normalizeRequestId(args.requestId),
      errorCode: args.errorCode ?? null,
    },
  });
}
