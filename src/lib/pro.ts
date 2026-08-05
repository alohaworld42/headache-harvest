import type { AppData, License, Trial } from './types';

export const TRIAL_DAYS = 14;
/** How long a licence stays valid without a successful re-check (offline grace). */
const VERIFY_GRACE_DAYS = 60;

export type ProSource = 'none' | 'trial' | 'license';

export interface ProStatus {
  /** Pro features are available — through a purchase or the trial. */
  active: boolean;
  /**
   * A purchase is in place. The doctor report is deliberately tied to this and
   * not to the trial: it is the feature people buy the app for, so handing it
   * out for free would leave no reason to pay.
   */
  paid: boolean;
  source: ProSource;
  trialDaysLeft: number;
  trialUsed: boolean;
  license?: License;
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((a.getTime() - b.getTime()) / 86_400_000);
}

export function licenseActive(license: License | undefined): boolean {
  if (!license) return false;
  const now = Date.now();
  if (license.expiresAt && new Date(license.expiresAt).getTime() < now) return false;
  const verified = new Date(license.verifiedAt).getTime();
  if (!Number.isFinite(verified)) return false;
  return now - verified < VERIFY_GRACE_DAYS * 86_400_000;
}

export function trialDaysLeft(trial: Trial | undefined): number {
  if (!trial) return 0;
  return Math.max(0, daysBetween(new Date(trial.endsAt), new Date()));
}

export function proStatus(data: AppData): ProStatus {
  const license = data.license;
  if (licenseActive(license)) {
    return {
      active: true,
      paid: true,
      source: 'license',
      trialDaysLeft: 0,
      trialUsed: Boolean(data.trial),
      license,
    };
  }
  const left = trialDaysLeft(data.trial);
  return {
    active: left > 0,
    paid: false,
    source: left > 0 ? 'trial' : 'none',
    trialDaysLeft: left,
    trialUsed: Boolean(data.trial),
    license,
  };
}

export function createTrial(): Trial {
  const start = new Date();
  const end = new Date(start.getTime() + TRIAL_DAYS * 86_400_000);
  return { startedAt: start.toISOString(), endsAt: end.toISOString() };
}

export interface PriceInfo {
  available: boolean;
  amount?: number;
  currency?: string;
  label?: string;
}

export interface PricingResponse {
  enabled: boolean;
  lifetime?: PriceInfo;
  yearly?: PriceInfo;
}

export async function fetchPricing(): Promise<PricingResponse> {
  try {
    const response = await fetch('/api/checkout', { headers: { accept: 'application/json' } });
    if (!response.ok) return { enabled: false };
    return (await response.json()) as PricingResponse;
  } catch {
    return { enabled: false };
  }
}

export async function startCheckout(plan: 'lifetime' | 'yearly'): Promise<string | null> {
  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

export interface RedeemResult {
  token: string;
  plan: 'lifetime' | 'yearly';
  email?: string;
}

export async function redeemSession(sessionId: string): Promise<RedeemResult | null> {
  try {
    const response = await fetch(`/api/license?session_id=${encodeURIComponent(sessionId)}`);
    if (!response.ok) return null;
    return (await response.json()) as RedeemResult;
  } catch {
    return null;
  }
}

/**
 * Three outcomes, and the difference matters: a licence may only be discarded
 * when the server actually says it is invalid. Treating an unreachable endpoint
 * as a rejection would log out paying customers who happen to be offline, or
 * whenever the deployment has a hiccup.
 */
export type VerifyResult =
  | { status: 'valid'; license: License }
  | { status: 'invalid' }
  | { status: 'unreachable' };

export async function verifyToken(token: string): Promise<VerifyResult> {
  let response: Response;
  try {
    response = await fetch('/api/license', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  } catch {
    return { status: 'unreachable' };
  }

  // 5xx and a missing endpoint are infrastructure problems, not verdicts.
  if (!response.ok) return { status: 'unreachable' };

  try {
    const data = (await response.json()) as {
      valid: boolean;
      plan?: string;
      email?: string;
      expiresAt?: string;
    };
    if (!data.valid) return { status: 'invalid' };
    return {
      status: 'valid',
      license: {
        token,
        email: data.email,
        plan: 'pro',
        verifiedAt: new Date().toISOString(),
        expiresAt: data.expiresAt,
      },
    };
  } catch {
    return { status: 'unreachable' };
  }
}

/**
 * Features gated behind Pro, in one place so the paywall stays auditable.
 * `paidOnly` entries are excluded from the trial.
 */
export const PRO_FEATURES = [
  { key: 'pro.feature.report', paidOnly: true },
  { key: 'pro.feature.insights', paidOnly: false },
  { key: 'pro.feature.csv', paidOnly: false },
  { key: 'pro.feature.year', paidOnly: false },
  { key: 'pro.feature.moh', paidOnly: false },
  { key: 'pro.feature.custom', paidOnly: false },
] as const;

/** The free tier still shows insights, but only for the most recent window. */
export const FREE_ANALYSIS_DAYS = 90;

/** Donation page. Configurable so a fork can point somewhere else. */
export const KOFI_HANDLE = import.meta.env.VITE_KOFI_HANDLE ?? 'sunspotter';
export const KOFI_URL = `https://ko-fi.com/${KOFI_HANDLE}`;
