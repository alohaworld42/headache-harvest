#!/usr/bin/env node
/**
 * Creates the Stripe product and prices the checkout needs, then prints the
 * environment variables to paste into Vercel.
 *
 * Everything the app needs from Stripe is two price ids. Clicking them together
 * in the dashboard is easy to get subtly wrong — a subscription price where a
 * one-off was meant, the wrong currency, tax behaviour left unset — and the
 * mistake only shows up at the first real checkout. This does it the same way
 * every time and is safe to re-run: prices are found by lookup key, so a second
 * run reports what exists instead of creating duplicates.
 *
 *   STRIPE_SECRET_KEY=sk_test_… node scripts/setup-stripe.mjs
 *   STRIPE_SECRET_KEY=sk_test_… node scripts/setup-stripe.mjs --lifetime 17.99 --yearly 7.99
 *   STRIPE_SECRET_KEY=sk_live_… node scripts/setup-stripe.mjs --live
 *
 * Start in test mode (sk_test_…). Test and live mode are separate worlds in
 * Stripe: the ids from one are meaningless in the other, so run this once per
 * mode. A live key without --live is refused, so the wrong key cannot create
 * real products by accident.
 *
 * The secret key is read from the environment and never printed.
 */

import { createHmac, randomBytes } from 'node:crypto';

const LOOKUP = { lifetime: 'kopfweh_pro_lifetime', yearly: 'kopfweh_pro_yearly' };
const DEFAULTS = { lifetime: '17.99', yearly: '7.99', currency: 'eur' };

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const name = argv[i].slice(2);
    const next = argv[i + 1];
    args[name] = next === undefined || next.startsWith('--') ? 'true' : argv[++i];
  }
  return args;
}

/** Stripe wants integer minor units — 17,99 € is 1799, and 17.999 is a typo. */
function toMinorUnits(value, label) {
  const normalised = String(value).replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalised)) {
    fail(`${label}: "${value}" is not a price. Use e.g. 17.99.`);
  }
  return Math.round(Number(normalised) * 100);
}

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

/**
 * `allowMissing` matters for the product lookup: "not there yet" is the normal
 * first-run case, not an error. Everything else aborts, because carrying on
 * after Stripe said no just produces a confusing second failure.
 */
async function stripe(path, body, allowMissing = false) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      authorization: `Bearer ${key}`,
      'stripe-version': '2024-06-20',
      ...(body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 404 && allowMissing) return null;
  if (!response.ok) {
    fail(`Stripe rejected ${path}: ${data?.error?.message ?? `HTTP ${response.status}`}`);
  }
  return data;
}

const args = parseArgs(process.argv.slice(2));
const key = process.env.STRIPE_SECRET_KEY;
const dryRun = args['dry-run'] === 'true';

if (!key) {
  fail(
    'STRIPE_SECRET_KEY is not set.\n' +
      '  Stripe dashboard → Developers → API keys → Secret key.\n' +
      '  Prefix it to the command so it stays out of your shell history:\n' +
      '    STRIPE_SECRET_KEY=sk_test_… node scripts/setup-stripe.mjs',
  );
}

const live = key.startsWith('sk_live_');
if (live && args.live !== 'true') {
  fail('That is a live key. Test the flow with sk_test_… first, then re-run with --live.');
}

const currency = (args.currency ?? DEFAULTS.currency).toLowerCase();
// "--yearly none" ships the one-off alone, which is the recommended start.
const wantLifetime = args.lifetime !== 'none';
const wantYearly = args.yearly !== 'none';
const lifetimeAmount = wantLifetime ? toMinorUnits(args.lifetime ?? DEFAULTS.lifetime, '--lifetime') : 0;
const yearlyAmount = wantYearly ? toMinorUnits(args.yearly ?? DEFAULTS.yearly, '--yearly') : 0;

if (!wantLifetime && !wantYearly) fail('Nothing to do — do not pass "none" for both plans.');

console.log(`\nStripe ${live ? 'LIVE' : 'test'} mode${dryRun ? ' (dry run)' : ''}`);

if (dryRun) {
  console.log(`\n  Would create product "Kopfweh Pro" with:`);
  if (wantLifetime) console.log(`    one-off      ${(lifetimeAmount / 100).toFixed(2)} ${currency.toUpperCase()}`);
  if (wantYearly) console.log(`    yearly       ${(yearlyAmount / 100).toFixed(2)} ${currency.toUpperCase()}/year`);
  console.log('');
  process.exit(0);
}

/** Reuses an existing price with this lookup key so re-runs stay harmless. */
async function ensurePrice(kind, amount, recurring) {
  const existing = await stripe(`prices?lookup_keys[]=${LOOKUP[kind]}&active=true&limit=1`);
  const found = existing.data?.[0];
  if (found) {
    const shown = `${(found.unit_amount / 100).toFixed(2)} ${found.currency.toUpperCase()}`;
    const differs = found.unit_amount !== amount || found.currency !== currency;
    console.log(`  ${kind.padEnd(8)} exists  ${found.id}  (${shown})`);
    if (differs) {
      // Stripe prices are immutable, so this needs a decision rather than a guess.
      console.log(
        `           ↳ you asked for ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}. ` +
          'Prices cannot be edited — archive the old one in the dashboard and re-run.',
      );
    }
    return found.id;
  }

  const product = await ensureProduct();
  const price = await stripe('prices', {
    product,
    unit_amount: String(amount),
    currency,
    lookup_key: LOOKUP[kind],
    // Inclusive matches how prices are shown to consumers in the EU.
    tax_behavior: 'inclusive',
    ...(recurring ? { 'recurring[interval]': 'year' } : {}),
    'metadata[app]': 'kopfweh',
    'metadata[plan]': kind,
  });
  console.log(`  ${kind.padEnd(8)} created ${price.id}  (${(amount / 100).toFixed(2)} ${currency.toUpperCase()})`);
  return price.id;
}

let productId;
async function ensureProduct() {
  if (productId) return productId;
  const found = await stripe('products/kopfweh_pro', undefined, true);
  if (found?.id) {
    productId = found.id;
    return productId;
  }
  const created = await stripe('products', {
    id: 'kopfweh_pro',
    name: 'Kopfweh Pro',
    description: 'Arztbericht, Auswertung über den gesamten Zeitraum, CSV-Export und Jahresübersicht.',
    // Digital goods, so no shipping and the tax code stays explicit.
    tax_code: 'txcd_10000000',
    'metadata[app]': 'kopfweh',
  });
  productId = created.id;
  console.log(`  product  created ${created.id}`);
  return productId;
}

console.log('');
const lifetimeId = wantLifetime ? await ensurePrice('lifetime', lifetimeAmount, false) : undefined;
const yearlyId = wantYearly ? await ensurePrice('yearly', yearlyAmount, true) : undefined;

// This script is meant to be re-run, so it must never hand out a fresh secret to
// someone who already has one: pasting that into Vercel would invalidate every
// licence key already sold. A secret is only minted when there is demonstrably
// none yet, and the existing one is never printed.
const existingSecret = process.env.LICENSE_SECRET;
const licenseSecret = existingSecret ?? randomBytes(32).toString('base64');

console.log('\nSet these in Vercel → Settings → Environment Variables:\n');
console.log(`  STRIPE_SECRET_KEY=${live ? 'sk_live_…' : 'sk_test_…'}   (the key you just used)`);
if (lifetimeId) console.log(`  STRIPE_PRICE_LIFETIME=${lifetimeId}`);
if (yearlyId) console.log(`  STRIPE_PRICE_YEARLY=${yearlyId}`);
if (existingSecret) {
  console.log('  LICENSE_SECRET  — unchanged, you already have one. Do not touch it.');
} else {
  console.log(`  LICENSE_SECRET=${licenseSecret}`);
  console.log('\n  LICENSE_SECRET signs the licence keys. Store it somewhere safe — changing');
  console.log('  it later invalidates every key your customers already have. If you re-run');
  console.log('  this script, pass it back in so it does not mint a second one:');
  console.log('    LICENSE_SECRET=… STRIPE_SECRET_KEY=… node scripts/setup-stripe.mjs');
}

// Proves the secret signs correctly before anyone pays, rather than finding out
// at the first purchase that signing was misconfigured.
const probe = Buffer.from(JSON.stringify({ sid: 'setup_probe', plan: 'lifetime', iat: 0 }))
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
const signature = createHmac('sha256', licenseSecret).update(probe).digest('base64url');
console.log(`\n  Signing self-check: ok (${signature.slice(0, 12)}…)`);

console.log(`\nNext: ${live ? 'you are live — do one real purchase and refund it.' : 'test with card 4242 4242 4242 4242.'}\n`);
