import { HeadacheEntry, HeadacheEntryArraySchema } from '../types';

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function exportJSON(entries: HeadacheEntry[]): void {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  triggerDownload(`kopfschmerz-export-${todayStamp()}.json`, blob);
}

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(';') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const DURATION_DE: Record<HeadacheEntry['duration'], string> = {
  short: 'kurz',
  medium: 'mittel',
  long: 'lang',
};

export function exportCSV(entries: HeadacheEntry[]): void {
  const header = [
    'datum',
    'intensitaet',
    'dauer',
    'lokalisation',
    'symptome',
    'ausloeser',
    'medikamente',
    'wirksamkeit',
    'notizen',
  ].join(';');

  const rows = entries.map(e => [
    e.date.slice(0, 10),
    String(e.intensity),
    DURATION_DE[e.duration],
    csvEscape((e.location ?? []).join(', ')),
    csvEscape((e.symptoms ?? []).join(', ')),
    csvEscape((e.triggers ?? []).join(', ')),
    csvEscape((e.medications ?? []).join(', ')),
    e.effectivenessRating ?? '',
    csvEscape(e.notes ?? ''),
  ].join(';'));

  const csv = '﻿' + [header, ...rows].join('\n');
  triggerDownload(`kopfschmerz-export-${todayStamp()}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
}

export async function importJSON(file: File): Promise<HeadacheEntry[]> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Datei ist kein gültiges JSON.');
  }
  const result = HeadacheEntryArraySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('JSON-Format passt nicht zum Kopfschmerz-Kalender-Export.');
  }
  return result.data;
}

export function mergeEntries(existing: HeadacheEntry[], incoming: HeadacheEntry[]): HeadacheEntry[] {
  const knownIds = new Set(existing.map(e => e.id));
  const additions = incoming.filter(e => !knownIds.has(e.id));
  return [...existing, ...additions];
}
