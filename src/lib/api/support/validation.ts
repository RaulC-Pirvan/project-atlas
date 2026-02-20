import { z } from 'zod';

export const supportTicketCategorySchema = z.enum(['billing', 'account', 'bug', 'feature_request']);

export const createSupportTicketSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Please enter at least 2 characters.')
      .max(80, 'Please keep this under 80 characters.'),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address.')
      .max(320, 'Please keep this under 320 characters.'),
    category: supportTicketCategorySchema,
    subject: z
      .string()
      .trim()
      .min(3, 'Please enter at least 3 characters.')
      .max(160, 'Please keep this under 160 characters.'),
    message: z
      .string()
      .trim()
      .min(10, 'Please enter at least 10 characters.')
      .max(5000, 'Please keep this under 5000 characters.'),
    honeypot: z.string().max(256).optional().default(''),
    captchaToken: z
      .string()
      .trim()
      .min(1, 'Captcha token is missing.')
      .max(4096, 'Captcha token is invalid.')
      .optional(),
  })
  .strict();

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

export const adminSupportTicketStatusSchema = z.enum(['open', 'in_progress', 'resolved']);

export const updateAdminSupportTicketStatusSchema = z
  .object({
    status: adminSupportTicketStatusSchema,
  })
  .strict();
