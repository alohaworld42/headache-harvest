import { appOrigin, env, isCheckoutConfigured, json, stripeRequest } from './_lib';

export const config = { runtime: 'edge' };

interface PriceInfo {
  available: boolean;
  amount?: number;
  currency?: string;
  label?: string;
}

async function loadPrice(priceId: string | undefined): Promise<PriceInfo> {
  if (!priceId) return { available: false };
  const result = await stripeRequest(`prices/${priceId}`);
  if (!result.ok) return { available: false };
  const amount = typeof result.data.unit_amount === 'number' ? result.data.unit_amount : undefined;
  const currency = typeof result.data.currency === 'string' ? result.data.currency : undefined;
  return {
    available: true,
    amount,
    currency,
    label:
      amount != null && currency
        ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency.toUpperCase() }).format(
            amount / 100,
          )
        : undefined,
  };
}

/**
 * GET  → pricing metadata so the client can render the paywall correctly.
 * POST → creates a Stripe Checkout session and returns its hosted URL.
 */
export default async function handler(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    if (!isCheckoutConfigured()) return json({ enabled: false });
    const [lifetime, yearly] = await Promise.all([
      loadPrice(env('STRIPE_PRICE_LIFETIME')),
      loadPrice(env('STRIPE_PRICE_YEARLY')),
    ]);
    return json({ enabled: lifetime.available || yearly.available, lifetime, yearly });
  }

  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, { allow: 'GET, POST' });
  }

  if (!isCheckoutConfigured()) return json({ error: 'checkout_not_configured' }, 503);

  let plan: 'lifetime' | 'yearly' = 'lifetime';
  try {
    const body = (await request.json()) as { plan?: string };
    if (body.plan === 'yearly') plan = 'yearly';
  } catch {
    // Body is optional; the lifetime plan is the default.
  }

  const priceId = plan === 'yearly' ? env('STRIPE_PRICE_YEARLY') : env('STRIPE_PRICE_LIFETIME');
  if (!priceId) return json({ error: 'plan_unavailable' }, 400);

  const origin = appOrigin(request);
  const session = await stripeRequest('checkout/sessions', {
    method: 'POST',
    body: {
      mode: plan === 'yearly' ? 'subscription' : 'payment',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      success_url: `${origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings?checkout=cancelled`,
      allow_promotion_codes: 'true',
      'automatic_tax[enabled]': env('STRIPE_AUTOMATIC_TAX') === '1' ? 'true' : 'false',
      'metadata[plan]': plan,
      'metadata[product]': 'schmerzverlauf-pro',
    },
  });

  if (!session.ok || typeof session.data.url !== 'string') {
    return json({ error: 'stripe_error', detail: session.data }, 502);
  }
  return json({ url: session.data.url, plan });
}
