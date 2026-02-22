type StripeCheckoutSessionCandidate = {
  id: string;
  created: number;
  status: string | null;
  paymentStatus: string | null;
  clientReferenceId: string | null;
  metadata: Record<string, unknown>;
  paymentIntentId: string | null;
  customerId: string | null;
  amountTotal: number | null;
  currency: string | null;
};

type StripeCheckoutListResponse = {
  data: StripeCheckoutSessionCandidate[];
  hasMore: boolean;
};

export type StripeCompletedCheckoutLookup = {
  checkoutSessionId: string;
  paymentIntentId: string | null;
  customerId: string | null;
  amountTotal: number | null;
  currency: string | null;
  createdAt: Date;
};

type FindLatestStripeCompletedCheckoutArgs = {
  secretKey: string;
  userId: string;
  productKey: string;
  maxPages?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function getNestedId(value: unknown): string | null {
  if (typeof value === 'string') return asString(value);
  if (!isRecord(value)) return null;
  return asString(value.id);
}

function toCheckoutSessionCandidate(value: unknown): StripeCheckoutSessionCandidate | null {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const created = asNumber(value.created);
  if (!id || created === null) return null;

  return {
    id,
    created,
    status: asString(value.status),
    paymentStatus: asString(value.payment_status),
    clientReferenceId: asString(value.client_reference_id),
    metadata: normalizeMetadata(value.metadata),
    paymentIntentId: getNestedId(value.payment_intent),
    customerId: getNestedId(value.customer),
    amountTotal: asNumber(value.amount_total),
    currency: asString(value.currency)?.toUpperCase() ?? null,
  };
}

function parseCheckoutSessionListResponse(payload: unknown): StripeCheckoutListResponse | null {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    return null;
  }

  const sessions: StripeCheckoutSessionCandidate[] = [];
  for (const row of payload.data) {
    const candidate = toCheckoutSessionCandidate(row);
    if (candidate) {
      sessions.push(candidate);
    }
  }

  return {
    data: sessions,
    hasMore: payload.has_more === true,
  };
}

function getMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  return asString(metadata[key]);
}

function matchesUserAndProduct(
  session: StripeCheckoutSessionCandidate,
  args: { userId: string; productKey: string },
): boolean {
  const metadataUserId = getMetadataString(session.metadata, 'userId');
  const metadataProductKey = getMetadataString(session.metadata, 'productKey') ?? args.productKey;
  const candidateUserId = metadataUserId ?? session.clientReferenceId;

  return candidateUserId === args.userId && metadataProductKey === args.productKey;
}

function isCompletedAndPaid(session: StripeCheckoutSessionCandidate): boolean {
  return session.status === 'complete' && session.paymentStatus === 'paid';
}

function toLookupResult(session: StripeCheckoutSessionCandidate): StripeCompletedCheckoutLookup {
  return {
    checkoutSessionId: session.id,
    paymentIntentId: session.paymentIntentId,
    customerId: session.customerId,
    amountTotal: session.amountTotal,
    currency: session.currency,
    createdAt: new Date(session.created * 1000),
  };
}

function pickLatestMatch(
  sessions: StripeCheckoutSessionCandidate[],
  args: { userId: string; productKey: string },
): StripeCompletedCheckoutLookup | null {
  const matches = sessions.filter(
    (session) => matchesUserAndProduct(session, args) && isCompletedAndPaid(session),
  );

  if (matches.length === 0) return null;

  matches.sort((a, b) => b.created - a.created);
  return toLookupResult(matches[0]);
}

async function fetchStripeJson(args: {
  secretKey: string;
  url: string;
}): Promise<{ status: number; payload: unknown }> {
  const response = await fetch(args.url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${args.secretKey}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;
  return {
    status: response.status,
    payload,
  };
}

function buildSearchQuery(args: { userId: string; productKey: string }): string {
  const safeUserId = args.userId.replaceAll("'", "\\'");
  const safeProductKey = args.productKey.replaceAll("'", "\\'");
  return [
    "status:'complete'",
    "payment_status:'paid'",
    `metadata['userId']:'${safeUserId}'`,
    `metadata['productKey']:'${safeProductKey}'`,
  ].join(' AND ');
}

async function findWithSearchEndpoint(args: FindLatestStripeCompletedCheckoutArgs) {
  const query = buildSearchQuery({
    userId: args.userId,
    productKey: args.productKey,
  });

  const searchUrl = `https://api.stripe.com/v1/checkout/sessions/search?limit=20&query=${encodeURIComponent(query)}`;
  const response = await fetchStripeJson({ secretKey: args.secretKey, url: searchUrl });

  // Stripe search can be unavailable in some environments; fallback to list endpoint.
  if (response.status === 400 || response.status === 404) {
    return null;
  }
  if (response.status >= 400) {
    throw new Error('Stripe checkout search failed.');
  }

  const parsed = parseCheckoutSessionListResponse(response.payload);
  if (!parsed) {
    throw new Error('Stripe checkout search response is invalid.');
  }

  return pickLatestMatch(parsed.data, {
    userId: args.userId,
    productKey: args.productKey,
  });
}

async function findWithListEndpoint(args: FindLatestStripeCompletedCheckoutArgs) {
  const maxPages = args.maxPages ?? 5;
  let page = 0;
  let startingAfter: string | null = null;
  let latest: StripeCompletedCheckoutLookup | null = null;

  while (page < maxPages) {
    const searchParams = new URLSearchParams();
    searchParams.set('limit', '100');
    if (startingAfter) {
      searchParams.set('starting_after', startingAfter);
    }

    const listUrl = `https://api.stripe.com/v1/checkout/sessions?${searchParams.toString()}`;
    const response = await fetchStripeJson({
      secretKey: args.secretKey,
      url: listUrl,
    });

    if (response.status >= 400) {
      throw new Error('Stripe checkout list query failed.');
    }

    const parsed = parseCheckoutSessionListResponse(response.payload);
    if (!parsed) {
      throw new Error('Stripe checkout list response is invalid.');
    }

    const candidate = pickLatestMatch(parsed.data, {
      userId: args.userId,
      productKey: args.productKey,
    });
    if (!latest || (candidate && candidate.createdAt.getTime() > latest.createdAt.getTime())) {
      latest = candidate;
    }

    if (!parsed.hasMore || parsed.data.length === 0) {
      break;
    }

    startingAfter = parsed.data[parsed.data.length - 1]?.id ?? null;
    if (!startingAfter) {
      break;
    }
    page += 1;
  }

  return latest;
}

export async function findLatestStripeCompletedCheckout(
  args: FindLatestStripeCompletedCheckoutArgs,
): Promise<StripeCompletedCheckoutLookup | null> {
  const fromSearch = await findWithSearchEndpoint(args);
  if (fromSearch) {
    return fromSearch;
  }

  return findWithListEndpoint(args);
}
