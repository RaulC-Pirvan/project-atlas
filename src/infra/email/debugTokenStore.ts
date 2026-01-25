const latestTokens = new Map<string, string>();

export function setLatestVerificationToken(email: string, token: string): void {
  latestTokens.set(email.toLowerCase(), token);
}

export function getLatestVerificationToken(email: string): string | null {
  return latestTokens.get(email.toLowerCase()) ?? null;
}
