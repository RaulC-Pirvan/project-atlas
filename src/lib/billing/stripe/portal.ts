export type StripeBillingPortalSession = {
  id: string;
  url: string;
};

type CreateStripeBillingPortalSessionArgs = {
  secretKey: string;
  customerId: string;
  returnUrl: string;
  configurationId?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export async function createStripeBillingPortalSession(
  args: CreateStripeBillingPortalSessionArgs,
): Promise<StripeBillingPortalSession> {
  const body = new URLSearchParams();
  body.set('customer', args.customerId);
  body.set('return_url', args.returnUrl);
  if (args.configurationId) {
    body.set('configuration', args.configurationId);
  }

  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;
  if (!response.ok) {
    throw new Error('Stripe billing portal session creation failed.');
  }

  if (!isRecord(payload)) {
    throw new Error('Stripe billing portal session response is invalid.');
  }

  const id = asString(payload.id);
  const url = asString(payload.url);
  if (!id || !url) {
    throw new Error('Stripe billing portal session response is missing id or url.');
  }

  return { id, url };
}
