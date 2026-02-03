type TokenStore = {
  byEmail: Map<string, string>;
  byUserId: Map<string, string>;
};

const globalStore = globalThis as typeof globalThis & {
  __atlasVerificationTokens?: TokenStore;
};

const store =
  globalStore.__atlasVerificationTokens ??
  (globalStore.__atlasVerificationTokens = {
    byEmail: new Map<string, string>(),
    byUserId: new Map<string, string>(),
  });

export function setLatestVerificationToken(email: string, token: string): void {
  store.byEmail.set(email.toLowerCase(), token);
}

export function getLatestVerificationToken(email: string): string | null {
  return store.byEmail.get(email.toLowerCase()) ?? null;
}

export function setLatestVerificationTokenForUser(userId: string, token: string): void {
  store.byUserId.set(userId, token);
}

export function getLatestVerificationTokenForUser(userId: string): string | null {
  return store.byUserId.get(userId) ?? null;
}
