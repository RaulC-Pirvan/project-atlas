import { setLatestVerificationToken } from './debugTokenStore';
import { sendEmail } from './resendClient';

type SendVerificationEmailArgs = {
  to: string;
  token: string;
  baseUrl?: string;
};

function getBaseUrl(explicit?: string): string {
  if (explicit) return explicit;
  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export async function sendVerificationEmail(args: SendVerificationEmailArgs): Promise<void> {
  const baseUrl = getBaseUrl(args.baseUrl);
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(args.token)}`;
  const from = process.env.RESEND_FROM_EMAIL ?? 'Project Atlas <noreply@projectatlas.dev>';

  const testMode =
    process.env.NODE_ENV !== 'production' || process.env.ENABLE_TEST_ENDPOINTS === 'true';

  if (testMode) {
    setLatestVerificationToken(args.to, args.token);
  }

  if (process.env.ENABLE_TEST_ENDPOINTS === 'true') {
    return;
  }

  await sendEmail({
    from,
    to: args.to,
    subject: 'Verify your email',
    html: `<p>Verify your email by clicking this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}
