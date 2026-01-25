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

  try {
    await sendEmail({
      from,
      to: args.to,
      subject: 'Verify your email',
      html: `
      <div style="background:#f7f7f7;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f0f0f;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6e6e6;border-radius:16px;">
          <tr>
            <td style="padding:28px 28px 16px 28px;">
              <p style="margin:0 0 12px 0;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#6b6b6b;">Project Atlas</p>
              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;">Verify your email</h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#4b4b4b;">
                Thanks for creating your account. Confirm your email to unlock full access.
              </p>
              <a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#0f0f0f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
                Verify email
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <p style="margin:16px 0 8px 0;font-size:12px;color:#6b6b6b;">Or copy and paste this link:</p>
              <p style="margin:0;font-size:12px;word-break:break-all;">
                <a href="${verifyUrl}" style="color:#0f0f0f;text-decoration:underline;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px 28px;border-top:1px solid #efefef;">
              <p style="margin:0;font-size:11px;color:#8a8a8a;">
                If you did not create an account, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn('[email] Verification email failed in non-production.', error);
  }
}
