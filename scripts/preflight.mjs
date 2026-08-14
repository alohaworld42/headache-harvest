#!/usr/bin/env node
/**
 * Checks a deployed instance before the first customer hits it.
 *
 * The failure modes that cost money are all quiet ones: a price id from Stripe's
 * test mode pasted into a live deployment, LICENSE_SECRET forgotten so keys are
 * signed with the Stripe key instead, an imprint still full of placeholders.
 * None of them show up by clicking around — the app looks fine right until
 * someone pays. This asks the deployment itself.
 *
 *   node scripts/preflight.mjs https://schmerzverlauf.de
 *   npm run preflight -- https://schmerzverlauf.de
 *
 * Read-only: it fetches public endpoints and never creates a checkout session.
 * Exits non-zero if anything blocking is wrong, so CI can gate on it.
 */

const target = process.argv[2]?.replace(/\/$/, '');

if (!target || !/^https?:\/\//.test(target)) {
  console.error('\n  Usage: node scripts/preflight.mjs https://your-deployment.vercel.app\n');
  process.exit(2);
}

const results = [];
const add = (level, name, detail) => results.push({ level, name, detail });
const pass = (name, detail) => add('pass', name, detail);
const warn = (name, detail) => add('warn', name, detail);
const fail = (name, detail) => add('fail', name, detail);

async function get(path) {
  try {
    const response = await fetch(`${target}${path}`, { redirect: 'follow' });
    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      // Not JSON — fine for HTML routes.
    }
    return { ok: response.ok, status: response.status, text, data };
  } catch (error) {
    return { ok: false, status: 0, text: '', data: null, error: String(error) };
  }
}

console.log(`\nPreflight: ${target}\n`);

// --- The app itself loads -----------------------------------------------------
const root = await get('/');

// Vercel's deployment protection answers every route with an SSO wall. Without
// this the checks below all fail for the same uninformative reason and read as
// a broken configuration, which is the opposite of the truth. The wall shows up
// as a redirect to sso-api on HTML routes and as a 401 JSON body on /api, so
// both are worth asking — following the redirect only lands on a login page.
const protectionProbe = await fetch(`${target}/`, { redirect: 'manual' })
  .then((r) => ({ location: r.headers.get('location') ?? '' }))
  .catch(() => ({ location: '' }));
const apiProbe = await fetch(`${target}/api/checkout`)
  .then((r) => r.json())
  .catch(() => null);

if (
  apiProbe?.protection?.vercel_auth_enabled ||
  /sso-api/.test(protectionProbe.location) ||
  /vercel\.com\/sso-api|Authentication Required/i.test(root.text)
) {
  console.error(
    '  Deployment protection is on — every route returns an SSO wall, so nothing\n' +
      '  below can be checked.\n\n' +
      '  Vercel → Project → Settings → Deployment Protection. Production must be\n' +
      '  public to sell; leaving it on for previews is fine. To keep it on and still\n' +
      '  check, create a Protection Bypass secret and append:\n' +
      `    ?x-vercel-protection-bypass=<secret>\n`,
  );
  process.exit(2);
}
if (!root.ok) {
  fail('App reachable', `GET / returned ${root.status || root.error}`);
} else if (!/<div id="root"/.test(root.text)) {
  fail('App reachable', 'GET / did not return the app shell');
} else {
  pass('App reachable', `HTTP ${root.status}`);
}

// A single-page app must serve deep links too, or a Stripe return lands on a 404.
const deep = await get('/pro/success');
if (deep.ok && /<div id="root"/.test(deep.text)) {
  pass('SPA rewrite', '/pro/success serves the app');
} else {
  fail('SPA rewrite', `/pro/success returned ${deep.status} — Stripe returns here after payment`);
}

// --- Checkout configuration ---------------------------------------------------
const checkout = await get('/api/checkout');
if (checkout.status === 404) {
  fail('Checkout endpoint', 'No /api routes — this looks like a static host, not Vercel');
} else if (!checkout.data) {
  fail('Checkout endpoint', `GET /api/checkout returned ${checkout.status}, not JSON`);
} else if (checkout.data.enabled !== true) {
  warn('Checkout enabled', 'Reports disabled — STRIPE_SECRET_KEY and a price id are not both set');
} else {
  pass('Checkout enabled', 'Stripe reachable and a price resolved');

  for (const plan of ['lifetime', 'yearly']) {
    const info = checkout.data[plan];
    if (!info?.available) {
      warn(`Price: ${plan}`, 'not configured');
      continue;
    }
    if (typeof info.amount !== 'number' || info.amount <= 0) {
      fail(`Price: ${plan}`, `resolved but amount is ${info.amount}`);
      continue;
    }
    // A price under a euro is almost always minor units mistaken for major ones.
    if (info.amount < 100) {
      fail(`Price: ${plan}`, `${info.label ?? info.amount} — suspiciously low, check the unit`);
    } else {
      pass(`Price: ${plan}`, info.label ?? `${info.amount} ${info.currency}`);
    }
  }

  if (!checkout.data.lifetime?.available) {
    warn('One-off price', 'Only the subscription is set up; the one-off is the stronger offer');
  }
}

// --- Licence verification -----------------------------------------------------
// A forged token must be rejected. If this passes, the endpoint is not verifying.
const forged = await fetch(`${target}/api/license`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ token: 'eyJzaWQiOiJmb3JnZWQiLCJwbGFuIjoibGlmZXRpbWUifQ.not-a-signature' }),
})
  .then(async (r) => ({ status: r.status, data: await r.json().catch(() => null) }))
  .catch((error) => ({ status: 0, data: null, error: String(error) }));

// Absence has to be proven by a JSON answer, not by a status code: a static host
// answers POST to a missing path with 405, which a 404-only check reads as a
// successful rejection — exactly backwards.
if (forged.status === 0) {
  fail('Licence endpoint', forged.error ?? 'unreachable');
} else if (forged.data === null) {
  fail('Licence endpoint', `no JSON from /api/license (HTTP ${forged.status}) — endpoint is not deployed`);
} else if (forged.data.valid === true) {
  fail('Licence endpoint', 'ACCEPTED A FORGED TOKEN — anyone could unlock Pro for free');
} else {
  pass('Licence endpoint', 'rejects an unsigned token');
}

// --- Legal pages --------------------------------------------------------------
// The placeholders are baked into the bundle at build time, so this catches a
// deployment whose VITE_LEGAL_* variables were set after the last build.
const legal = await get('/legal/imprint');
const bundleMatch = root.text.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/);
const bundle = bundleMatch ? await get(bundleMatch[0]) : null;
const haystack = `${legal.text}${bundle?.text ?? ''}`;

if (!legal.ok) {
  fail('Imprint reachable', `/legal/imprint returned ${legal.status}`);
} else if (/Betreiber:in eintragen|Anschrift eintragen|E-Mail eintragen/.test(haystack)) {
  fail(
    'Imprint filled in',
    'still contains placeholders — set VITE_LEGAL_* and redeploy (they are baked in at build time)',
  );
} else if (!bundle) {
  warn('Imprint filled in', 'could not locate the bundle to check');
} else {
  pass('Imprint filled in', 'no placeholders in the deployed bundle');
}

// --- Security headers ---------------------------------------------------------
const headers = await fetch(target).then((r) => r.headers).catch(() => null);
if (headers) {
  const missing = ['x-content-type-options', 'referrer-policy'].filter((h) => !headers.get(h));
  if (missing.length) warn('Security headers', `missing: ${missing.join(', ')}`);
  else pass('Security headers', 'present');
}

// --- Report -------------------------------------------------------------------
const icon = { pass: '  ok  ', warn: ' warn ', fail: ' FAIL ' };
console.log(results.map((r) => `${icon[r.level]} ${r.name.padEnd(20)} ${r.detail}`).join('\n'));

const failures = results.filter((r) => r.level === 'fail').length;
const warnings = results.filter((r) => r.level === 'warn').length;

console.log('');
if (failures) {
  console.log(`${failures} blocking problem${failures === 1 ? '' : 's'}. Not ready to sell.\n`);
  process.exit(1);
}
if (warnings) {
  console.log(`No blockers, ${warnings} warning${warnings === 1 ? '' : 's'} to look at.\n`);
  process.exit(0);
}
console.log('All checks passed. Do one real purchase, then refund it.\n');
