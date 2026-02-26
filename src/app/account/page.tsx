import { redirect } from 'next/navigation';

import { AccountPanel } from '../../components/auth/AccountPanel';
import { AppShell } from '../../components/layout/AppShell';
import { ProAccountCard } from '../../components/pro/ProAccountCard';
import {
  logProConversionEvent,
  logProConversionGuardrail,
  parseProCtaSourceWithReason,
} from '../../lib/analytics/proConversion';
import { getServerAuthSession } from '../../lib/auth/session';
import { shouldEnforceAdminTwoFactor } from '../../lib/auth/twoFactorPolicy';
import { parseStripeCheckoutQueryStatus } from '../../lib/billing/stripe/contracts';
import { prisma } from '../../lib/db/prisma';
import { logInfo } from '../../lib/observability/logger';
import { getProEntitlementSummary } from '../../lib/pro/entitlement';
import { resolveReminderSettings } from '../../lib/reminders/settings';

type SearchParams = {
  checkout?: string | string[];
  checkout_session_id?: string | string[];
  source?: string | string[];
};

function parseSearchParamValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCheckoutSessionId(value: string | string[] | undefined): string | null {
  const raw = parseSearchParamValue(value);
  if (!raw) return null;
  if (raw.length > 255) return null;
  return raw;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/sign-in');
  }

  const resolvedSearchParams = await searchParams;
  const checkoutStatus = parseStripeCheckoutQueryStatus(
    parseSearchParamValue(resolvedSearchParams?.checkout),
  );
  const checkoutSessionId = parseCheckoutSessionId(resolvedSearchParams?.checkout_session_id);
  const parsedSource = parseProCtaSourceWithReason(
    parseSearchParamValue(resolvedSearchParams?.source),
  );
  const source = parsedSource.source;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      twoFactorEnabled: true,
      weekStart: true,
      timezone: true,
      keepCompletedAtBottom: true,
      passwordSetAt: true,
      recoveryCodes: {
        where: {
          consumedAt: null,
          revokedAt: null,
        },
        select: { id: true },
      },
    },
  });

  if (!user) {
    redirect('/sign-in');
  }

  const proEntitlement = await getProEntitlementSummary({
    prisma,
    userId: session.user.id,
  });

  if (parsedSource.reason === 'invalid') {
    logProConversionGuardrail({
      reason: 'invalid_source_fallback',
      surface: '/account',
      authenticated: true,
      userId: session.user.id,
      source,
      rawSource: parsedSource.raw,
    });
  }

  if (checkoutStatus) {
    logInfo('billing.checkout.return', {
      route: '/account',
      userId: session.user.id,
      checkoutStatus,
      checkoutSessionId: checkoutSessionId ?? undefined,
      isPro: proEntitlement.isPro,
      source,
    });
    logProConversionEvent({
      event: 'pro_checkout_return',
      surface: '/account',
      authenticated: true,
      userId: session.user.id,
      source,
      checkoutStatus,
      checkoutSessionId,
      provider: 'stripe',
      isPro: proEntitlement.isPro,
    });
  }

  const reminderSettingsRecord = await prisma.userReminderSettings.findUnique({
    where: { userId: session.user.id },
    select: {
      dailyDigestEnabled: true,
      dailyDigestTimeMinutes: true,
      quietHoursEnabled: true,
      quietHoursStartMinutes: true,
      quietHoursEndMinutes: true,
      snoozeDefaultMinutes: true,
    },
  });

  const reminderSettings = resolveReminderSettings(reminderSettingsRecord);

  return (
    <AppShell title="Account" subtitle="Manage your profile and security.">
      <div className="space-y-10">
        <ProAccountCard isPro={proEntitlement.isPro} />
        <AccountPanel
          email={session.user.email ?? ''}
          displayName={session.user.name ?? session.user.email ?? 'User'}
          role={user.role}
          twoFactorEnabled={user.twoFactorEnabled}
          recoveryCodesRemaining={user.recoveryCodes.length}
          adminTwoFactorEnforced={shouldEnforceAdminTwoFactor()}
          weekStart={user.weekStart}
          keepCompletedAtBottom={user.keepCompletedAtBottom}
          hasPassword={Boolean(user.passwordSetAt)}
          reminderSettings={reminderSettings}
          timezoneLabel={user.timezone}
          initialCheckoutStatus={checkoutStatus}
        />
      </div>
    </AppShell>
  );
}
