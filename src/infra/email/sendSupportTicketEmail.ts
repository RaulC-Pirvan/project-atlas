import { sendEmail } from './resendClient';

type SendSupportTicketEmailArgs = {
  ticketId: string;
  category: 'billing' | 'account' | 'bug' | 'feature_request';
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatCategoryLabel(category: SendSupportTicketEmailArgs['category']): string {
  if (category === 'feature_request') {
    return 'Feature request';
  }

  return category[0]?.toUpperCase() + category.slice(1);
}

export async function sendSupportTicketEmail(args: SendSupportTicketEmailArgs): Promise<void> {
  const supportInbox = process.env.SUPPORT_INBOX_EMAIL?.trim();
  if (!supportInbox) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SUPPORT_INBOX_EMAIL is not set.');
    }
    return;
  }

  if (process.env.ENABLE_TEST_ENDPOINTS === 'true') {
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'Project Atlas <noreply@projectatlas.dev>';
  const createdAtIso = args.createdAt.toISOString();
  const categoryLabel = formatCategoryLabel(args.category);

  await sendEmail({
    from,
    to: supportInbox,
    subject: `[Atlas Support] [${categoryLabel}] ${args.subject}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#0f0f0f;">
        <h2 style="margin:0 0 12px 0;">New support ticket</h2>
        <p style="margin:0 0 8px 0;"><strong>Ticket:</strong> ${escapeHtml(args.ticketId)}</p>
        <p style="margin:0 0 8px 0;"><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
        <p style="margin:0 0 8px 0;"><strong>Name:</strong> ${escapeHtml(args.name)}</p>
        <p style="margin:0 0 8px 0;"><strong>Email:</strong> ${escapeHtml(args.email)}</p>
        <p style="margin:0 0 8px 0;"><strong>Created:</strong> ${escapeHtml(createdAtIso)}</p>
        <p style="margin:16px 0 8px 0;"><strong>Subject</strong></p>
        <p style="margin:0 0 12px 0;">${escapeHtml(args.subject)}</p>
        <p style="margin:16px 0 8px 0;"><strong>Message</strong></p>
        <pre style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:8px;">${escapeHtml(args.message)}</pre>
      </div>
    `,
  });
}
