'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage, parseJson } from '../../lib/api/client';
import type { WeekStart } from '../habits/weekdays';
import { Button } from '../ui/Button';
import { FormField } from '../ui/FormField';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Notice } from '../ui/Notice';
import { type ToastItem, ToastStack } from '../ui/Toast';
import { SignOutButton } from './SignOutButton';

type AccountPanelProps = {
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  twoFactorEnabled: boolean;
  recoveryCodesRemaining: number;
  adminTwoFactorEnforced: boolean;
  weekStart: WeekStart;
  keepCompletedAtBottom: boolean;
  hasPassword: boolean;
};

type AccountResponse = {
  ok: boolean;
};

type TwoFactorSetupResponse = {
  secret: string;
  otpauthUri: string;
  qrDataUrl: string;
};

type EnableTwoFactorResponse = {
  enabled: boolean;
  recoveryCodes: string[];
};

type RotateRecoveryCodesResponse = {
  recoveryCodes: string[];
};

type DisableTwoFactorResponse = {
  enabled: boolean;
};

type TwoFactorMethod = 'totp' | 'recovery_code';
type SensitiveStepUpAction = 'account_email_change' | 'account_password_change' | 'account_delete';
type SensitiveStepUpMethod = 'totp' | 'recovery_code' | 'password';

type AccountStepUpChallengeResponse = {
  challengeToken: string;
  expiresAt: string;
  methods: SensitiveStepUpMethod[];
};

type AccountStepUpVerifyResponse = {
  verified: boolean;
  action: SensitiveStepUpAction;
  method: SensitiveStepUpMethod;
  verifiedAt: string;
  stepUpChallengeToken: string;
};

type AccountSessionRecord = {
  id: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
};

type AccountSessionsResponse = {
  sessions: AccountSessionRecord[];
};

type AccountSessionRevokeResponse = {
  revoked: boolean;
  signedOutCurrent: boolean;
};

type AccountSessionBulkRevokeResponse = {
  revokedCount: number;
  scope: 'others' | 'all';
  signedOutCurrent: boolean;
};

export function AccountPanel({
  email,
  displayName,
  role,
  twoFactorEnabled,
  recoveryCodesRemaining,
  adminTwoFactorEnforced,
  weekStart,
  keepCompletedAtBottom,
  hasPassword,
}: AccountPanelProps) {
  const [nextEmail, setNextEmail] = useState(email);
  const [displayNameInput, setDisplayNameInput] = useState(displayName);
  const [weekStartInput, setWeekStartInput] = useState<WeekStart>(weekStart);
  const [keepCompletedAtBottomInput, setKeepCompletedAtBottomInput] =
    useState(keepCompletedAtBottom);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [updatingName, setUpdatingName] = useState(false);
  const [updatingWeekStart, setUpdatingWeekStart] = useState(false);
  const [updatingOrdering, setUpdatingOrdering] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmError, setDeleteConfirmError] = useState(false);
  const [hasPasswordSet, setHasPasswordSet] = useState(hasPassword);
  const [baselineDisplayName, setBaselineDisplayName] = useState(displayName);
  const [baselineWeekStart, setBaselineWeekStart] = useState<WeekStart>(weekStart);
  const [baselineKeepCompletedAtBottom, setBaselineKeepCompletedAtBottom] =
    useState(keepCompletedAtBottom);
  const [twoFactorEnabledState, setTwoFactorEnabledState] = useState(twoFactorEnabled);
  const [recoveryCodesRemainingState, setRecoveryCodesRemainingState] =
    useState(recoveryCodesRemaining);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [enablingTwoFactor, setEnablingTwoFactor] = useState(false);
  const [showRecoveryCodesModal, setShowRecoveryCodesModal] = useState(false);
  const [latestRecoveryCodes, setLatestRecoveryCodes] = useState<string[]>([]);
  const [rotateMethod, setRotateMethod] = useState<TwoFactorMethod>('totp');
  const [rotateCode, setRotateCode] = useState('');
  const [rotatingRecoveryCodes, setRotatingRecoveryCodes] = useState(false);
  const [disableMethod, setDisableMethod] = useState<TwoFactorMethod>('totp');
  const [disableCode, setDisableCode] = useState('');
  const [disableConfirmation, setDisableConfirmation] = useState('');
  const [disableCurrentPassword, setDisableCurrentPassword] = useState('');
  const [disablingTwoFactor, setDisablingTwoFactor] = useState(false);
  const [sessions, setSessions] = useState<AccountSessionRecord[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionRowLoadingId, setSessionRowLoadingId] = useState<string | null>(null);
  const [revokeOthersLoading, setRevokeOthersLoading] = useState(false);
  const [signOutAllLoading, setSignOutAllLoading] = useState(false);
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [stepUpAction, setStepUpAction] = useState<SensitiveStepUpAction | null>(null);
  const [stepUpChallengeToken, setStepUpChallengeToken] = useState<string | null>(null);
  const [stepUpMethods, setStepUpMethods] = useState<SensitiveStepUpMethod[]>([]);
  const [stepUpMethod, setStepUpMethod] = useState<SensitiveStepUpMethod>('password');
  const [stepUpCode, setStepUpCode] = useState('');
  const [stepUpStarting, setStepUpStarting] = useState(false);
  const [stepUpVerifying, setStepUpVerifying] = useState(false);

  const deleteConfirmInvalid = deleteConfirmError;
  const toastIdRef = useRef(0);
  const stepUpCompleteRef = useRef<((stepUpChallengeToken: string) => Promise<void>) | null>(null);
  const adminEnrollmentRequired =
    role === 'admin' && adminTwoFactorEnforced && !twoFactorEnabledState;

  const pushToast = useCallback((message: string, tone: ToastItem['tone'] = 'neutral') => {
    const id = toastIdRef.current + 1;
    toastIdRef.current = id;
    setToasts((prev) => [...prev, { id, tone, message, state: 'entering' }]);

    window.requestAnimationFrame(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: 'open' } : toast)),
      );
    });

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4800);

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, state: 'closing' } : toast)),
      );
    }, 4500);
  }, []);

  const formatSessionTimestamp = useCallback((value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Unknown';
    }
    return parsed.toLocaleString();
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);

    try {
      const response = await fetch('/api/account/sessions', {
        method: 'GET',
      });
      const body = await parseJson<AccountSessionsResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setSessions(body.data.sessions);
    } catch {
      pushToast('Unable to load active sessions right now.', 'error');
    } finally {
      setSessionsLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const resetStepUpModal = useCallback(() => {
    setShowStepUpModal(false);
    setStepUpAction(null);
    setStepUpChallengeToken(null);
    setStepUpMethods([]);
    setStepUpMethod('password');
    setStepUpCode('');
    stepUpCompleteRef.current = null;
  }, []);

  const startStepUpFlow = useCallback(
    async (
      action: SensitiveStepUpAction,
      onVerified: (stepUpChallengeToken: string) => Promise<void>,
    ) => {
      setStepUpStarting(true);

      try {
        const response = await fetch('/api/account/step-up/challenge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        const body = await parseJson<AccountStepUpChallengeResponse>(response);

        if (!response.ok || !body?.ok) {
          pushToast(getApiErrorMessage(response, body), 'error');
          return;
        }

        const nextMethods = body.data.methods;
        if (!nextMethods.length) {
          pushToast('No verification methods available for this action.', 'error');
          return;
        }

        stepUpCompleteRef.current = onVerified;
        setStepUpAction(action);
        setStepUpChallengeToken(body.data.challengeToken);
        setStepUpMethods(nextMethods);
        setStepUpMethod(nextMethods[0]);
        setStepUpCode('');
        setShowStepUpModal(true);
      } catch {
        pushToast('Unable to start security verification right now.', 'error');
      } finally {
        setStepUpStarting(false);
      }
    },
    [pushToast],
  );

  const handleStepUpVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stepUpChallengeToken || !stepUpAction) {
      pushToast('Verification challenge expired. Please try again.', 'error');
      resetStepUpModal();
      return;
    }

    if (!stepUpCode.trim()) {
      pushToast('Enter your verification code to continue.', 'error');
      return;
    }

    setStepUpVerifying(true);

    try {
      const response = await fetch('/api/account/step-up/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: stepUpChallengeToken,
          method: stepUpMethod,
          code: stepUpCode,
        }),
      });
      const body = await parseJson<AccountStepUpVerifyResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      if (body.data.action !== stepUpAction) {
        pushToast('Verification action mismatch detected. Please retry.', 'error');
        return;
      }

      const onVerified = stepUpCompleteRef.current;
      const proofToken = body.data.stepUpChallengeToken;
      resetStepUpModal();

      if (onVerified) {
        await onVerified(proofToken);
      } else {
        pushToast('Verification finished, but the pending action was lost.', 'error');
      }
    } catch {
      pushToast('Unable to verify this security check right now.', 'error');
    } finally {
      setStepUpVerifying(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setSessionRowLoadingId(sessionId);

    try {
      const response = await fetch(`/api/account/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      const body = await parseJson<AccountSessionRevokeResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      if (body.data.signedOutCurrent) {
        window.location.href = '/sign-in';
        return;
      }

      pushToast('Session signed out.', 'success');
      await loadSessions();
    } catch {
      pushToast('Unable to revoke this session right now.', 'error');
    } finally {
      setSessionRowLoadingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokeOthersLoading(true);

    try {
      const response = await fetch('/api/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'others' }),
      });
      const body = await parseJson<AccountSessionBulkRevokeResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      pushToast(
        body.data.revokedCount > 0
          ? `Signed out ${body.data.revokedCount} other session(s).`
          : 'No other sessions to sign out.',
        'success',
      );
      await loadSessions();
    } catch {
      pushToast('Unable to sign out other sessions right now.', 'error');
    } finally {
      setRevokeOthersLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    setSignOutAllLoading(true);

    try {
      const response = await fetch('/api/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'all' }),
      });
      const body = await parseJson<AccountSessionBulkRevokeResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      window.location.href = '/sign-in';
    } catch {
      pushToast('Unable to sign out all devices right now.', 'error');
    } finally {
      setSignOutAllLoading(false);
    }
  };

  const handleStartTwoFactorSetup = async () => {
    setSetupLoading(true);

    try {
      const response = await fetch('/api/account/2fa/setup', {
        method: 'POST',
      });
      const body = await parseJson<TwoFactorSetupResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setSetupCode('');
      setSetupData(body.data);
      pushToast('2FA setup started. Scan the QR code and verify with your app.', 'success');
    } catch {
      pushToast('Unable to start 2FA setup right now.', 'error');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEnableTwoFactor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!setupCode.trim()) {
      pushToast('Enter the 6-digit code from your authenticator app.', 'error');
      return;
    }

    setEnablingTwoFactor(true);

    try {
      const response = await fetch('/api/account/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: setupCode,
        }),
      });
      const body = await parseJson<EnableTwoFactorResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setTwoFactorEnabledState(true);
      setRecoveryCodesRemainingState(body.data.recoveryCodes.length);
      setLatestRecoveryCodes(body.data.recoveryCodes);
      setShowRecoveryCodesModal(true);
      setSetupCode('');
      setSetupData(null);
      pushToast('Two-factor authentication enabled.', 'success');
    } catch {
      pushToast('Unable to enable 2FA right now.', 'error');
    } finally {
      setEnablingTwoFactor(false);
    }
  };

  const handleRotateRecoveryCodes = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!rotateCode.trim()) {
      pushToast('Enter an authenticator or recovery code to regenerate backup codes.', 'error');
      return;
    }

    setRotatingRecoveryCodes(true);

    try {
      const response = await fetch('/api/account/2fa/recovery/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: rotateMethod,
          code: rotateCode,
        }),
      });
      const body = await parseJson<RotateRecoveryCodesResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setRotateCode('');
      setRecoveryCodesRemainingState(body.data.recoveryCodes.length);
      setLatestRecoveryCodes(body.data.recoveryCodes);
      setShowRecoveryCodesModal(true);
      pushToast('Recovery codes regenerated.', 'success');
    } catch {
      pushToast('Unable to regenerate recovery codes right now.', 'error');
    } finally {
      setRotatingRecoveryCodes(false);
    }
  };

  const handleDisableTwoFactor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disableConfirmation.trim().toUpperCase() !== 'DISABLE 2FA') {
      pushToast('Type DISABLE 2FA to confirm.', 'error');
      return;
    }

    if (hasPasswordSet && !disableCurrentPassword) {
      pushToast('Current password is required to disable 2FA.', 'error');
      return;
    }

    if (!disableCode.trim()) {
      pushToast('Enter your authentication code.', 'error');
      return;
    }

    setDisablingTwoFactor(true);

    try {
      const response = await fetch('/api/account/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: disableConfirmation,
          currentPassword: disableCurrentPassword || undefined,
          method: disableMethod,
          code: disableCode,
        }),
      });
      const body = await parseJson<DisableTwoFactorResponse>(response);

      if (!response.ok || !body?.ok) {
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setTwoFactorEnabledState(false);
      setRecoveryCodesRemainingState(0);
      setSetupData(null);
      setDisableCode('');
      setDisableConfirmation('');
      setDisableCurrentPassword('');
      pushToast('Two-factor authentication disabled.', 'success');
    } catch {
      pushToast('Unable to disable 2FA right now.', 'error');
    } finally {
      setDisablingTwoFactor(false);
    }
  };

  const handleDisplayNameUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedDisplayName = displayNameInput.trim();
    if (normalizedDisplayName.length < 2) {
      pushToast('Display name is required.', 'error');
      return;
    }

    if (normalizedDisplayName === baselineDisplayName.trim()) {
      pushToast('No changes to update.', 'neutral');
      return;
    }

    setUpdatingName(true);

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: normalizedDisplayName,
        }),
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          pushToast('Display name updates are not available yet.', 'error');
          return;
        }
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setBaselineDisplayName(normalizedDisplayName);
      setDisplayNameInput(normalizedDisplayName);
      pushToast('Display name updated.', 'success');
    } catch {
      pushToast('Display name update is not available yet.', 'error');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleEmailUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = nextEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      pushToast('Email is required.', 'error');
      return;
    }

    if (normalizedEmail === email.toLowerCase()) {
      pushToast('No changes to update.', 'neutral');
      return;
    }

    await startStepUpFlow('account_email_change', async (stepUpChallengeToken) => {
      setUpdatingEmail(true);

      try {
        const response = await fetch('/api/account', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            stepUpChallengeToken,
          }),
        });
        const body = await parseJson<AccountResponse>(response);

        if (!response.ok || !body?.ok) {
          if (response.status === 404) {
            pushToast('Email updates are not available yet.', 'error');
            return;
          }
          pushToast(getApiErrorMessage(response, body), 'error');
          return;
        }

        setNextEmail(normalizedEmail);
        setPendingEmail(normalizedEmail);
        setShowEmailChangeModal(true);
      } catch {
        pushToast('Email update is not available yet.', 'error');
      } finally {
        setUpdatingEmail(false);
      }
    });
  };

  const handleWeekStartUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (weekStartInput === baselineWeekStart) {
      pushToast('No changes to update.', 'neutral');
      return;
    }

    setUpdatingWeekStart(true);

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: weekStartInput,
        }),
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          pushToast('Week start updates are not available yet.', 'error');
          return;
        }
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setBaselineWeekStart(weekStartInput);
      pushToast('Week start updated.', 'success');
    } catch {
      pushToast('Week start update is not available yet.', 'error');
    } finally {
      setUpdatingWeekStart(false);
    }
  };

  const handleOrderingUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (keepCompletedAtBottomInput === baselineKeepCompletedAtBottom) {
      pushToast('No changes to update.', 'neutral');
      return;
    }

    setUpdatingOrdering(true);

    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keepCompletedAtBottom: keepCompletedAtBottomInput,
        }),
      });
      const body = await parseJson<AccountResponse>(response);

      if (!response.ok || !body?.ok) {
        if (response.status === 404) {
          pushToast('Ordering updates are not available yet.', 'error');
          return;
        }
        pushToast(getApiErrorMessage(response, body), 'error');
        return;
      }

      setBaselineKeepCompletedAtBottom(keepCompletedAtBottomInput);
      pushToast('Ordering preference updated.', 'success');
    } catch {
      pushToast('Ordering update is not available yet.', 'error');
    } finally {
      setUpdatingOrdering(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password) {
      pushToast('Enter a new password.', 'neutral');
      return;
    }

    if (password.length < 8) {
      pushToast('Password must be at least 8 characters.', 'error');
      return;
    }

    if (password !== confirm) {
      pushToast('Passwords do not match.', 'error');
      return;
    }

    await startStepUpFlow('account_password_change', async (stepUpChallengeToken) => {
      setUpdatingPassword(true);

      try {
        const response = await fetch('/api/account', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password,
            stepUpChallengeToken,
          }),
        });
        const body = await parseJson<AccountResponse>(response);

        if (!response.ok || !body?.ok) {
          if (response.status === 404) {
            pushToast('Password updates are not available yet.', 'error');
            return;
          }
          pushToast(getApiErrorMessage(response, body), 'error');
          return;
        }

        setPassword('');
        setConfirm('');
        setHasPasswordSet(true);
        pushToast('Password updated.', 'success');
      } catch {
        pushToast('Password update is not available yet.', 'error');
      } finally {
        setUpdatingPassword(false);
      }
    });
  };

  const handleEmailChangeAcknowledge = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/sign-in';
    }
  };

  const handleDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeleteConfirmError(false);

    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      setDeleteConfirmError(true);
      pushToast('Type DELETE to confirm.', 'error');
      return;
    }

    await startStepUpFlow('account_delete', async (stepUpChallengeToken) => {
      setDeleting(true);

      try {
        const response = await fetch('/api/account/delete-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepUpChallengeToken,
          }),
        });
        const body = await parseJson<AccountResponse>(response);

        if (!response.ok || !body?.ok) {
          if (response.status === 404) {
            pushToast('Delete requests are not available yet.', 'error');
            return;
          }
          pushToast(getApiErrorMessage(response, body), 'error');
          return;
        }

        setShowDeleteModal(true);
      } catch {
        pushToast('Delete request is not available yet.', 'error');
      } finally {
        setDeleting(false);
      }
    });
  };

  const handleDeleteAcknowledge = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/sign-up';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold">{baselineDisplayName}</p>
            <p className="text-xs text-black/50 dark:text-white/50">{email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      {adminEnrollmentRequired ? (
        <Notice tone="neutral">
          Admin access requires 2FA enrollment before you can continue to other app areas.
        </Notice>
      ) : null}

      <form className="space-y-6" onSubmit={handleDisplayNameUpdate}>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Display name
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">Update how your name appears.</p>
        </div>
        <FormField id="account-display-name" label="Display name" error={null}>
          <Input
            id="account-display-name"
            name="displayName"
            type="text"
            autoComplete="name"
            value={displayNameInput}
            onChange={(event) => setDisplayNameInput(event.target.value)}
          />
        </FormField>
        <Button type="submit" variant="outline" className="w-full" disabled={updatingName}>
          {updatingName ? 'Updating...' : 'Update display name'}
        </Button>
      </form>

      <form
        className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10"
        onSubmit={handleWeekStartUpdate}
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Week start
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Choose how the calendar week begins.
          </p>
        </div>
        <FormField id="account-week-start" label="Week starts on" error={null}>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={weekStartInput === 'mon' ? 'primary' : 'outline'}
              onClick={() => setWeekStartInput('mon')}
            >
              Monday
            </Button>
            <Button
              type="button"
              size="sm"
              variant={weekStartInput === 'sun' ? 'primary' : 'outline'}
              onClick={() => setWeekStartInput('sun')}
            >
              Sunday
            </Button>
          </div>
        </FormField>
        <Button type="submit" variant="outline" className="w-full" disabled={updatingWeekStart}>
          {updatingWeekStart ? 'Updating...' : 'Update week start'}
        </Button>
      </form>

      <form
        className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10"
        onSubmit={handleOrderingUpdate}
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Daily ordering
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Decide whether completed habits stay below unfinished ones.
          </p>
        </div>
        <FormField id="account-ordering" label="Completion ordering" error={null}>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={keepCompletedAtBottomInput ? 'primary' : 'outline'}
              onClick={() => setKeepCompletedAtBottomInput(true)}
            >
              Keep completed at bottom
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!keepCompletedAtBottomInput ? 'primary' : 'outline'}
              onClick={() => setKeepCompletedAtBottomInput(false)}
            >
              Keep original order
            </Button>
          </div>
        </FormField>
        <Button type="submit" variant="outline" className="w-full" disabled={updatingOrdering}>
          {updatingOrdering ? 'Updating...' : 'Update ordering'}
        </Button>
      </form>

      <section className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Two-factor authentication
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Protect your account with authenticator codes and one-time recovery codes.
          </p>
        </div>

        {!twoFactorEnabledState ? (
          <div className="space-y-4">
            <Notice tone="neutral">
              2FA is currently disabled. Enabling it adds a TOTP verification challenge at sign-in.
            </Notice>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={setupLoading}
              onClick={handleStartTwoFactorSetup}
            >
              {setupLoading ? 'Starting setup...' : 'Set up 2FA'}
            </Button>

            {setupData ? (
              <form
                className="space-y-4 rounded-2xl border border-black/10 p-4 dark:border-white/15"
                onSubmit={handleEnableTwoFactor}
              >
                <p className="text-sm font-medium">Scan QR code with your authenticator app</p>
                <Image
                  src={setupData.qrDataUrl}
                  alt="TOTP QR code"
                  width={176}
                  height={176}
                  unoptimized
                  className="mx-auto h-44 w-44 rounded-xl border border-black/10 bg-white p-2 dark:border-white/20"
                />
                <FormField id="manual-secret" label="Manual setup key" error={null}>
                  <Input id="manual-secret" value={setupData.secret} readOnly />
                </FormField>
                <FormField
                  id="setup-code"
                  label="Verification code"
                  hint="Enter the current 6-digit code."
                  error={null}
                >
                  <Input
                    id="setup-code"
                    value={setupCode}
                    onChange={(event) => setSetupCode(event.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </FormField>
                <Button type="submit" className="w-full" disabled={enablingTwoFactor}>
                  {enablingTwoFactor ? 'Verifying...' : 'Enable 2FA'}
                </Button>
              </form>
            ) : null}
          </div>
        ) : (
          <div className="space-y-8">
            <Notice tone="neutral">
              2FA is enabled. Active recovery codes: {recoveryCodesRemainingState}.
            </Notice>

            <form
              className="space-y-4 rounded-2xl border border-black/10 p-4 dark:border-white/15"
              onSubmit={handleRotateRecoveryCodes}
            >
              <p className="text-sm font-medium">Regenerate recovery codes</p>
              <p className="text-xs text-black/60 dark:text-white/60">
                Verify with a TOTP or existing recovery code. Old recovery codes are revoked.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={rotateMethod === 'totp' ? 'primary' : 'outline'}
                  onClick={() => setRotateMethod('totp')}
                >
                  TOTP code
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={rotateMethod === 'recovery_code' ? 'primary' : 'outline'}
                  onClick={() => setRotateMethod('recovery_code')}
                >
                  Recovery code
                </Button>
              </div>
              <FormField id="rotate-code" label="Verification code" error={null}>
                <Input
                  id="rotate-code"
                  value={rotateCode}
                  onChange={(event) => setRotateCode(event.target.value)}
                  autoComplete="one-time-code"
                />
              </FormField>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={rotatingRecoveryCodes}
              >
                {rotatingRecoveryCodes ? 'Regenerating...' : 'Generate new recovery codes'}
              </Button>
            </form>

            <form
              className="space-y-4 rounded-2xl border border-rose-300/60 p-4 dark:border-rose-400/40"
              onSubmit={handleDisableTwoFactor}
            >
              <p className="text-sm font-medium text-rose-700 dark:text-rose-200">Disable 2FA</p>
              {role === 'admin' && adminTwoFactorEnforced ? (
                <Notice tone="neutral">
                  Admin 2FA is required and cannot be disabled through self-service.
                </Notice>
              ) : null}
              <FormField id="disable-confirmation" label='Type "DISABLE 2FA"' error={null}>
                <Input
                  id="disable-confirmation"
                  value={disableConfirmation}
                  onChange={(event) => setDisableConfirmation(event.target.value)}
                />
              </FormField>
              {hasPasswordSet ? (
                <FormField id="disable-password" label="Current password" error={null}>
                  <Input
                    id="disable-password"
                    type="password"
                    autoComplete="current-password"
                    value={disableCurrentPassword}
                    onChange={(event) => setDisableCurrentPassword(event.target.value)}
                  />
                </FormField>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={disableMethod === 'totp' ? 'primary' : 'outline'}
                  onClick={() => setDisableMethod('totp')}
                >
                  TOTP code
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={disableMethod === 'recovery_code' ? 'primary' : 'outline'}
                  onClick={() => setDisableMethod('recovery_code')}
                >
                  Recovery code
                </Button>
              </div>
              <FormField id="disable-2fa-code" label="Verification code" error={null}>
                <Input
                  id="disable-2fa-code"
                  value={disableCode}
                  onChange={(event) => setDisableCode(event.target.value)}
                  autoComplete="one-time-code"
                />
              </FormField>
              <Button
                type="submit"
                variant="danger"
                className="w-full"
                disabled={disablingTwoFactor || (role === 'admin' && adminTwoFactorEnforced)}
              >
                {disablingTwoFactor ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </form>
          </div>
        )}
      </section>

      <section className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Active sessions
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Review where your account is signed in and revoke devices you no longer trust.
          </p>
        </div>

        {sessionsLoading ? (
          <p className="text-sm text-black/60 dark:text-white/60">Loading active sessions...</p>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((sessionRecord) => (
              <div
                key={sessionRecord.id}
                className="space-y-3 rounded-2xl border border-black/10 p-4 dark:border-white/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {sessionRecord.isCurrent ? 'Current device' : 'Signed-in device'}
                    </p>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      Last active: {formatSessionTimestamp(sessionRecord.lastActiveAt)}
                    </p>
                    <p className="text-xs text-black/60 dark:text-white/60">
                      Expires: {formatSessionTimestamp(sessionRecord.expiresAt)}
                    </p>
                    {sessionRecord.ipAddress ? (
                      <p className="text-xs text-black/60 dark:text-white/60">
                        IP: {sessionRecord.ipAddress}
                      </p>
                    ) : null}
                    {sessionRecord.userAgent ? (
                      <p className="text-xs text-black/60 dark:text-white/60">
                        Device: {sessionRecord.userAgent}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={sessionRecord.isCurrent ? 'danger' : 'outline'}
                    onClick={() => void handleRevokeSession(sessionRecord.id)}
                    disabled={sessionRowLoadingId === sessionRecord.id}
                  >
                    {sessionRowLoadingId === sessionRecord.id
                      ? 'Signing out...'
                      : sessionRecord.isCurrent
                        ? 'Sign out this device'
                        : 'Revoke session'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Notice tone="neutral">No active sessions found.</Notice>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleRevokeOtherSessions()}
            disabled={sessionsLoading || revokeOthersLoading}
          >
            {revokeOthersLoading ? 'Signing out others...' : 'Sign out other devices'}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => void handleSignOutAllDevices()}
            disabled={sessionsLoading || signOutAllLoading}
          >
            {signOutAllLoading ? 'Signing out all...' : 'Sign out all devices'}
          </Button>
        </div>
      </section>

      <form
        className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10"
        onSubmit={handleEmailUpdate}
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Email
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Email changes require a fresh security check (password or 2FA).
          </p>
        </div>
        <FormField id="account-email" label="Email" error={null}>
          <Input
            id="account-email"
            name="email"
            type="email"
            autoComplete="email"
            value={nextEmail}
            onChange={(event) => {
              const value = event.target.value;
              setNextEmail(value);
            }}
          />
        </FormField>
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={updatingEmail || stepUpStarting}
        >
          {updatingEmail
            ? 'Updating...'
            : stepUpStarting
              ? 'Starting verification...'
              : 'Update email'}
        </Button>
      </form>

      <form
        className="space-y-6 border-t border-black/10 pt-6 dark:border-white/10"
        onSubmit={handlePasswordUpdate}
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Password
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">Choose a new password.</p>
        </div>
        <FormField id="account-password" label="New password" error={null}>
          <Input
            id="account-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <FormField id="account-confirm" label="Confirm new password" error={null}>
          <Input
            id="account-confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </FormField>
        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={updatingPassword || stepUpStarting}
        >
          {updatingPassword
            ? 'Updating...'
            : stepUpStarting
              ? 'Starting verification...'
              : 'Update password'}
        </Button>
      </form>

      <form className="space-y-6" onSubmit={handleDelete}>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/80 dark:text-white/80">
            Delete request
          </p>
          <p className="text-sm text-black/60 dark:text-white/60">
            Type DELETE to request account removal.
          </p>
        </div>
        <FormField id="delete-confirm" label="Confirm" error={null}>
          <Input
            id="delete-confirm"
            name="confirm"
            type="text"
            value={deleteConfirm}
            className={deleteConfirmInvalid ? 'border-red-500 focus-visible:ring-red-500/30' : ''}
            onChange={(event) => {
              setDeleteConfirm(event.target.value);
              if (deleteConfirmError) setDeleteConfirmError(false);
            }}
          />
        </FormField>
        <Button
          type="submit"
          variant="danger"
          className="w-full"
          disabled={deleting || stepUpStarting}
        >
          {deleting
            ? 'Submitting...'
            : stepUpStarting
              ? 'Starting verification...'
              : 'Request delete'}
        </Button>
      </form>

      <Modal open={showStepUpModal} title="Security verification" eyebrow="Step-up auth">
        <form className="space-y-4" onSubmit={handleStepUpVerify}>
          <p>
            {stepUpAction === 'account_email_change'
              ? 'Confirm your identity to change your email address.'
              : stepUpAction === 'account_password_change'
                ? 'Confirm your identity to change your password.'
                : 'Confirm your identity to delete this account.'}
          </p>
          {stepUpMethods.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {stepUpMethods.map((methodOption) => (
                <Button
                  key={methodOption}
                  type="button"
                  size="sm"
                  variant={stepUpMethod === methodOption ? 'primary' : 'outline'}
                  onClick={() => setStepUpMethod(methodOption)}
                >
                  {methodOption === 'totp'
                    ? 'TOTP code'
                    : methodOption === 'recovery_code'
                      ? 'Recovery code'
                      : 'Password'}
                </Button>
              ))}
            </div>
          ) : null}
          <FormField
            id="step-up-code"
            label={stepUpMethod === 'password' ? 'Current password' : 'Verification code'}
            error={null}
          >
            <Input
              id="step-up-code"
              type={stepUpMethod === 'password' ? 'password' : 'text'}
              autoComplete={stepUpMethod === 'password' ? 'current-password' : 'one-time-code'}
              value={stepUpCode}
              onChange={(event) => setStepUpCode(event.target.value)}
            />
          </FormField>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={resetStepUpModal}
              disabled={stepUpVerifying || stepUpStarting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={stepUpVerifying || stepUpStarting}>
              {stepUpVerifying ? 'Verifying...' : 'Verify and continue'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showDeleteModal}
        title="Account deleted"
        footer={
          <Button type="button" size="lg" onClick={handleDeleteAcknowledge}>
            Create a new account
          </Button>
        }
      >
        <p>
          Your account has been permanently deleted. You have been signed out and will need to
          create a new account to continue.
        </p>
      </Modal>

      <Modal
        open={showEmailChangeModal}
        title="Email updated"
        footer={
          <Button type="button" size="lg" onClick={handleEmailChangeAcknowledge}>
            Sign in again
          </Button>
        }
      >
        <p>
          Your email has been changed{pendingEmail ? ` to ${pendingEmail}` : ''}. We sent a new
          verification link. You will be signed out now and must verify the new email before
          accessing your account.
        </p>
      </Modal>

      <Modal
        open={showRecoveryCodesModal}
        title="Recovery codes"
        footer={
          <Button type="button" size="lg" onClick={() => setShowRecoveryCodesModal(false)}>
            I saved these codes
          </Button>
        }
      >
        <div className="space-y-4">
          <p>
            Save these one-time recovery codes now. They are shown only once and can be used if you
            lose access to your authenticator app.
          </p>
          <div className="grid grid-cols-1 gap-2 rounded-xl border border-black/10 p-3 text-sm dark:border-white/15 sm:grid-cols-2">
            {latestRecoveryCodes.map((code) => (
              <code key={code} className="rounded-lg bg-black/5 px-2 py-1 dark:bg-white/10">
                {code}
              </code>
            ))}
          </div>
        </div>
      </Modal>

      <ToastStack toasts={toasts} />
    </div>
  );
}
