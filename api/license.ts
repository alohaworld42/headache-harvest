import { json, signLicense, stripeRequest, verifyLicense, YEAR_SECONDS } from './_lib';

export const config = { runtime: 'edge' };

/**
 * GET  ?session_id=cs_… → exchanges a paid Stripe Checkout session for a licence token.
 * POST { token }        → re-validates a stored token (used on app start and for restore).
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    const sessionId = new URL(request.url).searchParams.get('session_id');
    if (!sessionId) return json({ error: 'missing_session_id' }, 400);

    const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (!session.ok) return json({ error: 'session_not_found' }, 404);

    const paid = session.data.payment_status === 'paid' || session.data.status === 'complete';
    if (!paid) return json({ error: 'not_paid', status: session.data.payment_status }, 402);

    const metadata = (session.data.metadata ?? {}) as Record<string, string>;
    const plan = metadata.plan === 'yearly' ? 'yearly' : 'lifetime';
    const details = (session.data.customer_details ?? {}) as Record<string, unknown>;
    const email =
      typeof details.email === 'string'
        ? details.email
        : typeof session.data.customer_email === 'string'
          ? (session.data.customer_email as string)
          : undefined;

    const issuedAt = Math.floor(Date.now() / 1000);
    const token = await signLicense({
      sid: sessionId,
      email,
      plan,
      iat: issuedAt,
      exp: plan === 'yearly' ? issuedAt + YEAR_SECONDS : undefined,
    });
    return json({ token, plan, email });
  }

  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, { allow: 'GET, POST' });
  }

  let token = '';
  try {
    const body = (await request.json()) as { token?: string };
    token = body.token ?? '';
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  if (!token) return json({ valid: false }, 400);

  const payload = await verifyLicense(token);
  if (!payload) return json({ valid: false }, 200);

  return json({
    valid: true,
    plan: payload.plan,
    email: payload.email,
    expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
  });
}
