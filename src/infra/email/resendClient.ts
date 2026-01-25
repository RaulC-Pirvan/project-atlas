type SendEmailArgs = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

type SendEmailResult = { delivered: true; id: string } | { delivered: false; skipped: true };

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is not set.');
    }

    console.warn('[email] RESEND_API_KEY missing; email send skipped.');
    return { delivered: false, skipped: true };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.status}`);
  }

  const data = (await response.json()) as { id?: string };
  return { delivered: true, id: data.id ?? 'unknown' };
}
