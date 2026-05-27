import { HeadacheEntry } from '../types';

export type TimeRange = 'month' | 'quarter' | 'year' | 'all';

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  month: 'Aktueller Monat',
  quarter: 'Letzte 3 Monate',
  year: 'Letzte 12 Monate',
  all: 'Alle Daten',
};

export function filterByRange(entries: HeadacheEntry[], range: TimeRange): HeadacheEntry[] {
  if (range === 'all') return entries;
  const now = new Date();
  const cutoff = new Date(now);
  if (range === 'month') {
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);
  } else if (range === 'quarter') {
    cutoff.setMonth(now.getMonth() - 3);
  } else {
    cutoff.setFullYear(now.getFullYear() - 1);
  }
  return entries.filter(e => new Date(e.date) >= cutoff);
}

function topEntry<T extends string>(counts: Record<T, number>): { name: T; count: number } | null {
  const entries = Object.entries(counts) as [T, number][];
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return { name: entries[0][0], count: entries[0][1] };
}

function tally(entries: HeadacheEntry[], pick: (e: HeadacheEntry) => string[] | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    const values = pick(e);
    if (!values) continue;
    for (const v of values) {
      counts[v] = (counts[v] ?? 0) + 1;
    }
  }
  return counts;
}

export interface Insights {
  entryCount: number;
  averageIntensity: number | null;
  topTrigger: { name: string; count: number } | null;
  topSymptom: { name: string; count: number } | null;
  topLocation: { name: string; count: number } | null;
  dominantDuration: { duration: 'short' | 'medium' | 'long'; count: number } | null;
  bestMedication: { name: string; effectiveRate: number; uses: number } | null;
}

export function computeInsights(entries: HeadacheEntry[]): Insights {
  const entryCount = entries.length;
  const averageIntensity = entryCount > 0
    ? entries.reduce((sum, e) => sum + e.intensity, 0) / entryCount
    : null;

  const topTrigger = topEntry(tally(entries, e => e.triggers));
  const topSymptom = topEntry(tally(entries, e => e.symptoms));
  const topLocation = topEntry(tally(entries, e => e.location));

  const durationCounts: Record<'short' | 'medium' | 'long', number> = { short: 0, medium: 0, long: 0 };
  for (const e of entries) durationCounts[e.duration]++;
  const dominantDuration = entryCount > 0
    ? (['short', 'medium', 'long'] as const)
        .map(d => ({ duration: d, count: durationCounts[d] }))
        .sort((a, b) => b.count - a.count)[0]
    : null;

  const medStats: Record<string, { ja: number; wenig: number; nein: number; total: number }> = {};
  for (const e of entries) {
    if (!e.medications || !e.effectivenessRating) continue;
    for (const med of e.medications) {
      const stat = medStats[med] ?? (medStats[med] = { ja: 0, wenig: 0, nein: 0, total: 0 });
      stat[e.effectivenessRating]++;
      stat.total++;
    }
  }
  const medCandidates = Object.entries(medStats)
    .filter(([, s]) => s.total >= 3)
    .map(([name, s]) => ({ name, effectiveRate: s.ja / s.total, uses: s.total }))
    .sort((a, b) => b.effectiveRate - a.effectiveRate);
  const bestMedication = medCandidates[0] ?? null;

  return {
    entryCount,
    averageIntensity,
    topTrigger,
    topSymptom,
    topLocation,
    dominantDuration,
    bestMedication,
  };
}

const DURATION_LABELS: Record<'short' | 'medium' | 'long', string> = {
  short: 'kurz (unter 6 Stunden)',
  medium: 'mittel (6–12 Stunden)',
  long: 'lang (über 12 Stunden)',
};

export function describeInsights(insights: Insights): string[] {
  if (insights.entryCount < 3) {
    return ['Mehr Daten für eine aussagekräftige Auswertung nötig (mindestens 3 Einträge im Zeitraum).'];
  }
  const lines: string[] = [];
  lines.push(
    `${insights.entryCount} Einträge im Zeitraum, durchschnittliche Intensität ${insights.averageIntensity!.toFixed(1)}/10.`
  );
  if (insights.topTrigger) {
    lines.push(`Häufigster Auslöser: "${insights.topTrigger.name}" (${insights.topTrigger.count}×).`);
  }
  if (insights.topSymptom) {
    lines.push(`Häufigstes Begleitsymptom: "${insights.topSymptom.name}" (${insights.topSymptom.count}×).`);
  }
  if (insights.topLocation) {
    lines.push(`Häufigste Lokalisation: "${insights.topLocation.name}" (${insights.topLocation.count}×).`);
  }
  if (insights.dominantDuration && insights.dominantDuration.count > 0) {
    lines.push(`Episoden waren überwiegend ${DURATION_LABELS[insights.dominantDuration.duration]}.`);
  }
  if (insights.bestMedication) {
    const pct = Math.round(insights.bestMedication.effectiveRate * 100);
    lines.push(
      `Wirksamstes Medikament: "${insights.bestMedication.name}" (${pct}% positiv bei ${insights.bestMedication.uses} Anwendungen).`
    );
  }
  return lines;
}
