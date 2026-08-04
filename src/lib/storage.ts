import type { AppData, Attack, LegacyEntry, Settings } from './types';

const STORAGE_KEY = 'headtrack.v2';
const LEGACY_KEY = 'headacheEntries';
export const DATA_VERSION = 2;

export const defaultSettings: Settings = {
  language: 'de',
  theme: 'system',
  customTriggers: [],
  customSymptoms: [],
  customMedications: [],
  trackCycle: false,
  reminderEnabled: false,
  reminderTime: '20:00',
  onboardingDone: false,
};

export function emptyData(): AppData {
  return {
    version: DATA_VERSION,
    attacks: [],
    settings: { ...defaultSettings },
    updatedAt: new Date().toISOString(),
  };
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function legacyDurationToMinutes(duration?: LegacyEntry['duration']): number | undefined {
  switch (duration) {
    case 'short':
      return 3 * 60;
    case 'medium':
      return 9 * 60;
    case 'long':
      return 18 * 60;
    default:
      return undefined;
  }
}

function legacyEffectiveness(rating?: LegacyEntry['effectivenessRating']) {
  switch (rating) {
    case 'ja':
      return 'full' as const;
    case 'wenig':
      return 'partial' as const;
    case 'nein':
      return 'none' as const;
    default:
      return 'unknown' as const;
  }
}

/** Converts entries written by the pre-2.0 app into the current attack shape. */
export function migrateLegacyEntries(entries: LegacyEntry[]): Attack[] {
  const now = new Date().toISOString();
  return entries
    .filter((entry) => entry && typeof entry.date === 'string')
    .map((entry) => ({
      id: entry.id || newId(),
      date: entry.date.slice(0, 10),
      durationMinutes: legacyDurationToMinutes(entry.duration),
      intensity: clampIntensity(entry.intensity),
      type: 'other' as const,
      aura: false,
      locations: entry.location ?? [],
      symptoms: entry.symptoms ?? [],
      triggers: entry.triggers ?? [],
      medications: (entry.medications ?? []).map((name) => ({
        id: newId(),
        name,
        medClass: 'other' as const,
        effectiveness: legacyEffectiveness(entry.effectivenessRating),
      })),
      relief: [],
      impact: 'moderate' as const,
      notes: entry.notes,
      createdAt: now,
      updatedAt: now,
    }));
}

export function clampIntensity(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 5;
  return Math.min(10, Math.max(1, Math.round(num)));
}

function isAttackLike(value: unknown): value is Attack {
  if (typeof value !== 'object' || value === null) return false;
  const attack = value as Partial<Attack>;
  return typeof attack.id === 'string' && typeof attack.date === 'string';
}

/** Fills in fields that may be missing after an import or a partial write. */
export function normalizeAttack(raw: Attack): Attack {
  const now = new Date().toISOString();
  return {
    ...raw,
    date: raw.date.slice(0, 10),
    intensity: clampIntensity(raw.intensity),
    type: raw.type ?? 'other',
    aura: Boolean(raw.aura),
    locations: raw.locations ?? [],
    symptoms: raw.symptoms ?? [],
    triggers: raw.triggers ?? [],
    relief: raw.relief ?? [],
    impact: raw.impact ?? 'moderate',
    medications: (raw.medications ?? []).map((med) => ({
      ...med,
      id: med.id || newId(),
      medClass: med.medClass ?? 'other',
      effectiveness: med.effectiveness ?? 'unknown',
    })),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return emptyData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return {
        version: DATA_VERSION,
        attacks: (parsed.attacks ?? []).filter(isAttackLike).map(normalizeAttack),
        settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
        license: parsed.license,
        trial: parsed.trial,
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      };
    }
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as LegacyEntry[];
      if (Array.isArray(parsed)) {
        const data = emptyData();
        data.attacks = migrateLegacyEntries(parsed);
        // Mark onboarding as done so returning users are not shown the intro.
        data.settings.onboardingDone = data.attacks.length > 0;
        saveData(data);
        return data;
      }
    }
  } catch {
    // Corrupted storage should never block the app from starting.
  }
  return emptyData();
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: AppData = { ...data, version: DATA_VERSION, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota errors are surfaced by the caller via the UI, not thrown here.
  }
}

export interface BackupFile {
  app: 'headtrack';
  version: number;
  exportedAt: string;
  attacks: Attack[];
  settings?: Settings;
}

export function buildBackup(data: AppData): BackupFile {
  return {
    app: 'headtrack',
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
    attacks: data.attacks,
    settings: data.settings,
  };
}

export interface ParsedBackup {
  attacks: Attack[];
  settings?: Partial<Settings>;
}

/** Accepts both the current backup format and raw legacy exports. */
export function parseBackup(text: string): ParsedBackup {
  const parsed = JSON.parse(text) as unknown;
  if (Array.isArray(parsed)) {
    const looksLegacy = parsed.some(
      (item) => typeof item === 'object' && item !== null && 'effectivenessRating' in item,
    );
    if (looksLegacy) return { attacks: migrateLegacyEntries(parsed as LegacyEntry[]) };
    const attacks = parsed.filter(isAttackLike).map(normalizeAttack);
    if (attacks.length !== parsed.length) throw new Error('unsupported');
    return { attacks };
  }
  if (typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as BackupFile).attacks)) {
    const file = parsed as BackupFile;
    return {
      attacks: file.attacks.filter(isAttackLike).map(normalizeAttack),
      settings: file.settings,
    };
  }
  throw new Error('unsupported');
}

/** Merges imported attacks into existing ones, newest write wins per id and per day+time. */
export function mergeAttacks(current: Attack[], incoming: Attack[]): Attack[] {
  const byKey = new Map<string, Attack>();
  const keyOf = (attack: Attack) => `${attack.date}|${attack.startTime ?? ''}|${attack.intensity}`;
  for (const attack of current) byKey.set(attack.id, attack);
  const dedupe = new Map<string, string>();
  for (const attack of current) dedupe.set(keyOf(attack), attack.id);

  for (const attack of incoming) {
    const existingId = byKey.has(attack.id) ? attack.id : dedupe.get(keyOf(attack));
    if (existingId) {
      const existing = byKey.get(existingId)!;
      if (new Date(attack.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
        byKey.set(existingId, { ...attack, id: existingId });
      }
    } else {
      byKey.set(attack.id, attack);
      dedupe.set(keyOf(attack), attack.id);
    }
  }
  return [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date));
}
