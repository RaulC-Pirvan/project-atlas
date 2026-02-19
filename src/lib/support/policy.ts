export const SUPPORT_SUBMISSION_IP_LIMIT = {
  windowMs: 15 * 60 * 1000,
  max: 5,
} as const;

export const SUPPORT_SUBMISSION_EMAIL_LIMIT = {
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
} as const;

export const SUPPORT_CAPTCHA_TRIGGER_ATTEMPTS_PER_HOUR = 8;
export const SUPPORT_CAPTCHA_TRIGGER_HONEYPOT_HITS_PER_DAY = 2;

export type SupportCaptchaDecisionInput = {
  attemptsLastHour: number;
  honeypotHitsLastDay: number;
};

export function shouldRequireSupportCaptcha(input: SupportCaptchaDecisionInput): boolean {
  return (
    input.attemptsLastHour >= SUPPORT_CAPTCHA_TRIGGER_ATTEMPTS_PER_HOUR ||
    input.honeypotHitsLastDay >= SUPPORT_CAPTCHA_TRIGGER_HONEYPOT_HITS_PER_DAY
  );
}
