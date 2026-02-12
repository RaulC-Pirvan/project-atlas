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
