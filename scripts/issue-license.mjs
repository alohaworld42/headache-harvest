#!/usr/bin/env node
/**
 * Mints a Pro licence key without going through Stripe.
 *
 * Needed for the cases the checkout does not cover: someone paid via Ko-fi or
 * bank transfer, a customer lost their key, or you want to hand one to a tester.
 * The key is the exact same HMAC-signed token /api/license issues, so the app
 * validates it the same way.
 *
 *   LICENSE_SECRET=… node scripts/issue-license.mjs --email a@b.de
 *   LICENSE_SECRET=… node scripts/issue-license.mjs --plan yearly --email a@b.de
 *
 * LICENSE_SECRET must match the value set in the Vercel project, otherwise the
 * app will reject the key on its next check.
 */

import { createHmac } from 'node:crypto';

function parseArgs(argv) {
  const args = { plan: 'lifetime' };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    const value = argv[i + 1]?.startsWith('--') ? 'true' : argv[++i];
    args[name] = value ?? 'true';
  }
  return args;
}

function base64Url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const args = parseArgs(process.argv.slice(2));
const secret = process.env.LICENSE_SECRET ?? process.env.STRIPE_SECRET_KEY;

if (!secret) {
  console.error('LICENSE_SECRET is not set. Use the same value as the Vercel project.');
  process.exit(1);
}
if (args.plan !== 'lifetime' && args.plan !== 'yearly') {
  console.error(`Unknown plan "${args.plan}". Use lifetime or yearly.`);
  process.exit(1);
}

const issuedAt = Math.floor(Date.now() / 1000);
const payload = {
  // Manually issued keys are marked so they can be told apart in support cases.
  sid: args.sid ?? `manual_${issuedAt}`,
  email: args.email,
  plan: args.plan,
  iat: issuedAt,
  ...(args.plan === 'yearly' ? { exp: issuedAt + 365 * 24 * 60 * 60 } : {}),
};

const body = base64Url(JSON.stringify(payload));
const signature = createHmac('sha256', secret).update(body).digest('base64url');

console.log(`\nPlan:   ${payload.plan}`);
console.log(`E-Mail: ${payload.email ?? '(none)'}`);
if (payload.exp) console.log(`Valid until: ${new Date(payload.exp * 1000).toISOString().slice(0, 10)}`);
console.log('\nLicence key — paste under Settings → Pro → "Restore purchase":\n');
console.log(`${body}.${signature}\n`);
