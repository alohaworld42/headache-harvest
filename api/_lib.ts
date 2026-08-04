/**
 * Shared helpers for the Vercel Edge functions.
 *
 * The whole payment flow is deliberately stateless: Stripe is the source of truth
 * for "has this person paid", and the licence is a short HMAC-signed token the
 * client stores locally. No database, no user accounts, no health data server side.
 */

export const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

export function env(name: string): string | undefined {
  const value = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
  return value && value.length > 0 ? value : undefined;
}

export function isCheckoutConfigured(): boolean {
  return Boolean(env('STRIPE_SECRET_KEY') && (env('STRIPE_PRICE_LIFETIME') || env('STRIPE_PRICE_YEARLY')));
}

export function appOrigin(request: Request): string {
  const configured = env('APP_URL');
  if (configured) return configured.replace(/\/$/, '');
  const url = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  return `${proto}://${forwardedHost ?? url.host}`;
}

/** Calls the Stripe REST API directly so the function stays dependency free. */
export async function stripeRequest(
  path: string,
  init: { method: 'GET' | 'POST'; body?: Record<string, string> } = { method: 'GET' },
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const key = env('STRIPE_SECRET_KEY');
  if (!key) return { ok: false, status: 503, data: { error: 'stripe_not_configured' } };

  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: init.method,
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/x-www-form-urlencoded',
      'stripe-version': '2024-06-20',
    },
    body: init.body ? new URLSearchParams(init.body).toString() : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, status: response.status, data };
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export interface LicensePayload {
  /** Stripe checkout session id the licence was issued for. */
  sid: string;
  email?: string;
  plan: 'lifetime' | 'yearly';
  /** Issued at, epoch seconds. */
  iat: number;
  /** Expiry, epoch seconds. Absent for lifetime licences. */
  exp?: number;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = env('LICENSE_SECRET') ?? env('STRIPE_SECRET_KEY');
  if (!secret) throw new Error('missing_license_secret');
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signLicense(payload: LicensePayload): Promise<string> {
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyLicense(token: string): Promise<LicensePayload | null> {
  const [body, signature] = token.trim().split('.');
  if (!body || !signature) return null;
  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signature),
      new TextEncoder().encode(body),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as LicensePayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const YEAR_SECONDS = 365 * 24 * 60 * 60;
