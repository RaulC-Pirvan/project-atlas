import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  displayName: z.string().min(2).max(80),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export const updateAccountSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).max(72).optional(),
    currentPassword: z.string().min(8).max(72).optional(),
    stepUpChallengeToken: z.string().min(1).max(512).optional(),
    displayName: z.string().min(2).max(80).optional(),
    weekStart: z.enum(['sun', 'mon']).optional(),
    keepCompletedAtBottom: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.email ||
      data.password ||
      data.displayName !== undefined ||
      data.weekStart ||
      data.keepCompletedAtBottom !== undefined,
    {
      message: 'Provide an email, password, display name, week start, or ordering preference.',
    },
  );

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const stepUpActionSchema = z.enum([
  'account_email_change',
  'account_password_change',
  'account_delete',
  'admin_access',
]);

export const createTwoFactorChallengeSchema = z.object({
  action: stepUpActionSchema,
});

export const accountStepUpActionSchema = z.enum([
  'account_email_change',
  'account_password_change',
  'account_delete',
]);

export const createAccountStepUpChallengeSchema = z
  .object({
    action: accountStepUpActionSchema,
  })
  .strict();

export const verifyAccountStepUpChallengeSchema = z
  .object({
    challengeToken: z.string().min(1),
    method: z.enum(['totp', 'recovery_code', 'password']),
    code: z.string().min(1).max(128),
  })
  .strict();

export const verifyTwoFactorChallengeSchema = z
  .object({
    challengeToken: z.string().min(1),
    method: z.enum(['totp', 'recovery_code']),
    code: z.string().min(1).max(64),
  })
  .strict();

export const verifySignInTwoFactorSchema = z
  .object({
    challengeToken: z.string().min(1),
    method: z.enum(['totp', 'recovery_code']),
    code: z.string().min(1).max(64),
  })
  .strict();

export const enableTwoFactorSchema = z
  .object({
    code: z.string().min(1).max(16),
  })
  .strict();

export const disableTwoFactorSchema = z
  .object({
    confirmation: z.string().min(1).max(32),
    currentPassword: z.string().min(8).max(72).optional(),
    method: z.enum(['totp', 'recovery_code']),
    code: z.string().min(1).max(64),
  })
  .strict();

export const rotateRecoveryCodesSchema = z
  .object({
    method: z.enum(['totp', 'recovery_code']),
    code: z.string().min(1).max(64),
  })
  .strict();

export const manageSessionsSchema = z
  .object({
    scope: z.enum(['others', 'all']),
  })
  .strict();

export const deleteAccountRequestSchema = z
  .object({
    stepUpChallengeToken: z.string().min(1).max(512),
  })
  .strict();
