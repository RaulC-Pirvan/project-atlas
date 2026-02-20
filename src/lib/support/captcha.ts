type CaptchaVerifyResult = {
  ok: boolean;
};

type TurnstileVerifyResponse = {
  success?: boolean;
};

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function getConfiguredProvider(): string | null {
  const value = process.env.SUPPORT_CAPTCHA_PROVIDER?.trim().toLowerCase();
  return value && value.length > 0 ? value : null;
}

function getCaptchaSecret(): string | null {
  const value = process.env.SUPPORT_CAPTCHA_SECRET?.trim();
  return value && value.length > 0 ? value : null;
}

export function isSupportCaptchaConfigured(): boolean {
  const provider = getConfiguredProvider();
  if (!provider) {
    return false;
  }

  if (provider !== 'turnstile') {
    return false;
  }

  return !!getCaptchaSecret();
}

export async function verifySupportCaptcha(args: {
  token: string;
  ipAddress: string;
}): Promise<CaptchaVerifyResult> {
  const provider = getConfiguredProvider();
  if (provider !== 'turnstile') {
    return { ok: false };
  }

  const secret = getCaptchaSecret();
  if (!secret) {
    return { ok: false };
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret,
      response: args.token,
      remoteip: args.ipAddress,
    }).toString(),
  });

  if (!response.ok) {
    return { ok: false };
  }

  const body = (await response.json()) as TurnstileVerifyResponse;
  return { ok: body.success === true };
}
