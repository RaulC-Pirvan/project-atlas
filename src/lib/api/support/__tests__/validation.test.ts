import { describe, expect, it } from 'vitest';

import { createSupportTicketSchema } from '../validation';

describe('createSupportTicketSchema', () => {
  it('accepts a valid support ticket payload', () => {
    const parsed = createSupportTicketSchema.safeParse({
      name: 'Atlas User',
      email: 'user@example.com',
      category: 'bug',
      subject: 'Unable to save habit',
      message: 'I cannot save a habit from the habits page after editing weekdays.',
      honeypot: '',
    });

    expect(parsed.success).toBe(true);
  });

  it('rejects invalid category', () => {
    const parsed = createSupportTicketSchema.safeParse({
      name: 'Atlas User',
      email: 'user@example.com',
      category: 'other',
      subject: 'Question',
      message: 'Need support',
    });

    expect(parsed.success).toBe(false);
  });
});
