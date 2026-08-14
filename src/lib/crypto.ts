/**
 * Passphrase-encrypted backups.
 *
 * The point of these files is that they can be parked anywhere — cloud drive,
 * e-mail to yourself, USB stick — without the health data inside being readable.
 * Everything happens in the browser via WebCrypto; no key ever leaves the device
 * and there is nothing to recover if the passphrase is lost.
 */

const MAGIC = 'schmerzverlauf-encrypted-backup';
/**
 * The app was called Kopfweh before, and files written under that name are the
 * ones people are least able to recreate. Reading them stays supported forever;
 * only new files carry the current marker.
 */
const LEGACY_MAGIC = 'kopfweh-encrypted-backup';
const FORMAT_VERSION = 1;
/** OWASP's 2023 floor for PBKDF2-HMAC-SHA256; ~0.3 s on a mid-range phone. */
const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface EncryptedEnvelope {
  app: typeof MAGIC | typeof LEGACY_MAGIC;
  v: number;
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string };
  cipher: 'AES-GCM';
  iv: string;
  data: string;
  createdAt: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptBackup(plaintext: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  const envelope: EncryptedEnvelope = {
    app: MAGIC,
    v: FORMAT_VERSION,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: PBKDF2_ITERATIONS, salt: toBase64(salt) },
    cipher: 'AES-GCM',
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
    createdAt: new Date().toISOString(),
  };
  return JSON.stringify(envelope, null, 2);
}

export function isEncryptedBackup(text: string): boolean {
  try {
    const parsed = JSON.parse(text) as Partial<EncryptedEnvelope>;
    return (
      (parsed.app === MAGIC || parsed.app === LEGACY_MAGIC) && typeof parsed.data === 'string'
    );
  } catch {
    return false;
  }
}

export class WrongPassphraseError extends Error {
  constructor() {
    super('wrong_passphrase');
    this.name = 'WrongPassphraseError';
  }
}

export async function decryptBackup(text: string, passphrase: string): Promise<string> {
  const envelope = JSON.parse(text) as EncryptedEnvelope;
  if (envelope.app !== MAGIC && envelope.app !== LEGACY_MAGIC) throw new Error('unsupported');
  if (envelope.v > FORMAT_VERSION) throw new Error('newer_version');

  const key = await deriveKey(
    passphrase,
    fromBase64(envelope.kdf.salt),
    envelope.kdf.iterations ?? PBKDF2_ITERATIONS,
  );
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv) },
      key,
      fromBase64(envelope.data),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    // AES-GCM fails authentication for both a wrong key and a tampered file.
    throw new WrongPassphraseError();
  }
}

/** Rough guard so people do not protect years of data with "1234". */
export function passphraseStrength(passphrase: string): 'weak' | 'ok' | 'strong' {
  const length = passphrase.length;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((re) => re.test(passphrase)).length;
  if (length >= 16 || (length >= 12 && classes >= 3)) return 'strong';
  if (length >= 10 || (length >= 8 && classes >= 2)) return 'ok';
  return 'weak';
}
