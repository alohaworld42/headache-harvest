import type { Locale } from 'date-fns';
import {
  addDays,
  differenceInCalendarDays,
  eachMonthOfInterval,
  format,
  getDay,
  parseISO,
  startOfMonth,
  subDays,
} from 'date-fns';
import { MOH_HIGH_THRESHOLD_CLASSES, MOH_LOW_THRESHOLD_CLASSES } from './catalog';
import type { Attack, MedicationClass } from './types';

export const ISO = 'yyyy-MM-dd';

export function today(): string {
  return format(new Date(), ISO);
}

export function inRange(attack: Attack, from: string, to: string): boolean {
  return attack.date >= from && attack.date <= to;
}

export function filterRange(attacks: Attack[], from: string, to: string): Attack[] {
  return attacks.filter((attack) => inRange(attack, from, to));
}

export function rangeFromDays(days: number): { from: string; to: string } {
  const to = new Date();
  return { from: format(subDays(to, days - 1), ISO), to: format(to, ISO) };
}

export interface Summary {
  attackCount: number;
  headacheDays: number;
  daysInRange: number;
  avgIntensity: number;
  maxIntensity: number;
  avgDurationMinutes: number;
  totalDurationMinutes: number;
  medicationDays: number;
  acuteMedicationIntakes: number;
  severeDays: number;
  auraShare: number;
  headacheDayShare: number;
}

const ACUTE_CLASSES: MedicationClass[] = [
  ...MOH_LOW_THRESHOLD_CLASSES.filter((cls) => cls !== 'cgrp'),
  ...MOH_HIGH_THRESHOLD_CLASSES,
  'cgrp',
];

function isAcute(medClass: MedicationClass): boolean {
  return medClass !== 'preventive' && ACUTE_CLASSES.includes(medClass);
}

export function summarize(attacks: Attack[], from: string, to: string): Summary {
  const scoped = filterRange(attacks, from, to);
  const days = new Set(scoped.map((attack) => attack.date));
  const withDuration = scoped.filter((attack) => typeof attack.durationMinutes === 'number');
  const totalDuration = withDuration.reduce((sum, attack) => sum + (attack.durationMinutes ?? 0), 0);
  const medicationDays = new Set(
    scoped
      .filter((attack) => attack.medications.some((med) => isAcute(med.medClass)))
      .map((attack) => attack.date),
  );
  const acuteIntakes = scoped.reduce(
    (sum, attack) => sum + attack.medications.filter((med) => isAcute(med.medClass)).length,
    0,
  );
  const daysInRange = Math.max(1, differenceInCalendarDays(parseISO(to), parseISO(from)) + 1);

  return {
    attackCount: scoped.length,
    headacheDays: days.size,
    daysInRange,
    avgIntensity: scoped.length
      ? scoped.reduce((sum, attack) => sum + attack.intensity, 0) / scoped.length
      : 0,
    maxIntensity: scoped.reduce((max, attack) => Math.max(max, attack.intensity), 0),
    avgDurationMinutes: withDuration.length ? totalDuration / withDuration.length : 0,
    totalDurationMinutes: totalDuration,
    medicationDays: medicationDays.size,
    acuteMedicationIntakes: acuteIntakes,
    severeDays: new Set(scoped.filter((attack) => attack.impact === 'severe').map((a) => a.date)).size,
    auraShare: scoped.length ? scoped.filter((attack) => attack.aura).length / scoped.length : 0,
    headacheDayShare: days.size / daysInRange,
  };
}

export interface MonthPoint {
  key: string; // yyyy-MM
  label: string;
  headacheDays: number;
  attacks: number;
  avgIntensity: number;
  medicationDays: number;
}

export function monthlySeries(attacks: Attack[], from: string, to: string, locale?: Locale): MonthPoint[] {
  if (!attacks.length) return [];
  const months = eachMonthOfInterval({ start: parseISO(from), end: parseISO(to) });
  const scoped = filterRange(attacks, from, to);
  return months.map((month) => {
    const key = format(month, 'yyyy-MM');
    const monthAttacks = scoped.filter((attack) => attack.date.startsWith(key));
    const days = new Set(monthAttacks.map((attack) => attack.date));
    const medDays = new Set(
      monthAttacks.filter((a) => a.medications.some((m) => isAcute(m.medClass))).map((a) => a.date),
    );
    return {
      key,
      label: format(month, 'MMM yy', { locale }),
      headacheDays: days.size,
      attacks: monthAttacks.length,
      avgIntensity: monthAttacks.length
        ? monthAttacks.reduce((sum, a) => sum + a.intensity, 0) / monthAttacks.length
        : 0,
      medicationDays: medDays.size,
    };
  });
}

export interface CountPoint {
  id: string;
  count: number;
  share: number;
}

export function countBy(attacks: Attack[], pick: (attack: Attack) => string[]): CountPoint[] {
  const counts = new Map<string, number>();
  for (const attack of attacks) {
    for (const value of new Set(pick(attack))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  const total = attacks.length || 1;
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count, share: count / total }))
    .sort((a, b) => b.count - a.count);
}

export function weekdayDistribution(attacks: Attack[]): { weekday: number; count: number }[] {
  const counts = new Array(7).fill(0) as number[];
  for (const attack of attacks) {
    // date-fns getDay is 0=Sunday, shift to Monday-first for European weeks.
    const day = (getDay(parseISO(attack.date)) + 6) % 7;
    counts[day] += 1;
  }
  return counts.map((count, weekday) => ({ weekday, count }));
}

export function hourDistribution(attacks: Attack[]): { bucket: string; count: number }[] {
  const buckets = [0, 3, 6, 9, 12, 15, 18, 21];
  const counts = new Map<number, number>(buckets.map((b) => [b, 0]));
  for (const attack of attacks) {
    if (!attack.startTime) continue;
    const hour = Number(attack.startTime.slice(0, 2));
    if (!Number.isFinite(hour)) continue;
    const bucket = buckets.reduce((acc, b) => (hour >= b ? b : acc), 0);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return buckets.map((bucket) => ({
    bucket: `${String(bucket).padStart(2, '0')}–${String((bucket + 3) % 24).padStart(2, '0')}`,
    count: counts.get(bucket) ?? 0,
  }));
}

export interface MedicationStat {
  name: string;
  medClass: MedicationClass;
  intakes: number;
  days: number;
  fullRelief: number;
  partialRelief: number;
  noRelief: number;
  /** 0-1, share of rated intakes that brought full or partial relief. */
  successRate: number;
}

export function medicationStats(attacks: Attack[]): MedicationStat[] {
  const map = new Map<string, MedicationStat & { dayset: Set<string> }>();
  for (const attack of attacks) {
    for (const med of attack.medications) {
      const key = med.name.trim().toLowerCase();
      if (!key) continue;
      let stat = map.get(key);
      if (!stat) {
        stat = {
          name: med.name.trim(),
          medClass: med.medClass,
          intakes: 0,
          days: 0,
          fullRelief: 0,
          partialRelief: 0,
          noRelief: 0,
          successRate: 0,
          dayset: new Set<string>(),
        };
        map.set(key, stat);
      }
      stat.intakes += 1;
      stat.dayset.add(attack.date);
      if (med.effectiveness === 'full') stat.fullRelief += 1;
      if (med.effectiveness === 'partial') stat.partialRelief += 1;
      if (med.effectiveness === 'none') stat.noRelief += 1;
    }
  }
  return [...map.values()]
    .map(({ dayset, ...stat }) => {
      const rated = stat.fullRelief + stat.partialRelief + stat.noRelief;
      return {
        ...stat,
        days: dayset.size,
        successRate: rated ? (stat.fullRelief + stat.partialRelief * 0.5) / rated : 0,
      };
    })
    .sort((a, b) => b.intakes - a.intakes);
}

export type MohLevel = 'ok' | 'watch' | 'risk';

export interface MohMonth {
  key: string;
  lowThresholdDays: number; // triptans, combination, ergots, opioids
  highThresholdDays: number; // simple analgesics and NSAIDs
  level: MohLevel;
}

/**
 * Medication-overuse thresholds follow the ICHD-3 definition: 10 days per month for
 * triptans, ergots, opioids and combination analgesics, 15 days for simple analgesics.
 */
export function mohByMonth(attacks: Attack[]): MohMonth[] {
  const months = new Map<string, { low: Set<string>; high: Set<string> }>();
  for (const attack of attacks) {
    const key = attack.date.slice(0, 7);
    let bucket = months.get(key);
    if (!bucket) {
      bucket = { low: new Set(), high: new Set() };
      months.set(key, bucket);
    }
    for (const med of attack.medications) {
      if (MOH_LOW_THRESHOLD_CLASSES.includes(med.medClass)) bucket.low.add(attack.date);
      if (MOH_HIGH_THRESHOLD_CLASSES.includes(med.medClass)) bucket.high.add(attack.date);
    }
  }
  return [...months.entries()]
    .map(([key, bucket]) => {
      const low = bucket.low.size;
      const high = bucket.high.size;
      let level: MohLevel = 'ok';
      if (low >= 10 || high >= 15) level = 'risk';
      else if (low >= 8 || high >= 12) level = 'watch';
      return { key, lowThresholdDays: low, highThresholdDays: high, level };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

export interface TriggerImpact {
  id: string;
  count: number;
  share: number;
  avgIntensity: number;
  avgDurationMinutes: number;
  /** Difference to the average intensity of attacks without this trigger. */
  intensityDelta: number;
}

export function triggerImpact(attacks: Attack[], minCount = 2): TriggerImpact[] {
  const ids = new Set(attacks.flatMap((attack) => attack.triggers));
  const result: TriggerImpact[] = [];
  for (const id of ids) {
    const withTrigger = attacks.filter((attack) => attack.triggers.includes(id));
    if (withTrigger.length < minCount) continue;
    const without = attacks.filter((attack) => !attack.triggers.includes(id));
    const avg = (list: Attack[]) =>
      list.length ? list.reduce((sum, a) => sum + a.intensity, 0) / list.length : 0;
    const durations = withTrigger.filter((a) => typeof a.durationMinutes === 'number');
    result.push({
      id,
      count: withTrigger.length,
      share: withTrigger.length / (attacks.length || 1),
      avgIntensity: avg(withTrigger),
      avgDurationMinutes: durations.length
        ? durations.reduce((sum, a) => sum + (a.durationMinutes ?? 0), 0) / durations.length
        : 0,
      intensityDelta: without.length ? avg(withTrigger) - avg(without) : 0,
    });
  }
  return result.sort((a, b) => b.count - a.count);
}

export interface Streaks {
  currentFreeDays: number;
  longestFreeDays: number;
  lastAttackDate?: string;
}

export function streaks(attacks: Attack[]): Streaks {
  if (!attacks.length) return { currentFreeDays: 0, longestFreeDays: 0 };
  const days = [...new Set(attacks.map((attack) => attack.date))].sort();
  const last = days[days.length - 1];
  const currentFreeDays = Math.max(0, differenceInCalendarDays(new Date(), parseISO(last)));

  let longest = 0;
  for (let i = 1; i < days.length; i += 1) {
    const gap = differenceInCalendarDays(parseISO(days[i]), parseISO(days[i - 1])) - 1;
    if (gap > longest) longest = gap;
  }
  return {
    currentFreeDays,
    longestFreeDays: Math.max(longest, currentFreeDays),
    lastAttackDate: last,
  };
}

export interface CalendarCell {
  date: string;
  attacks: Attack[];
  maxIntensity: number;
}

export function calendarIndex(attacks: Attack[]): Map<string, CalendarCell> {
  const map = new Map<string, CalendarCell>();
  for (const attack of attacks) {
    const cell = map.get(attack.date);
    if (cell) {
      cell.attacks.push(attack);
      cell.maxIntensity = Math.max(cell.maxIntensity, attack.intensity);
    } else {
      map.set(attack.date, { date: attack.date, attacks: [attack], maxIntensity: attack.intensity });
    }
  }
  return map;
}

export type InsightLevel = 'info' | 'positive' | 'warning' | 'critical';

export interface Insight {
  id: string;
  level: InsightLevel;
  title: string;
  body: string;
}

export interface InsightContext {
  attacks: Attack[];
  from: string;
  to: string;
  lang: 'de' | 'en';
  labelFor: (kind: 'trigger' | 'symptom', id: string) => string;
}

const texts = {
  de: {
    mohTitle: 'Verdacht auf Medikamenten-Übergebrauch',
    mohBody: (months: number) =>
      `In ${months} ${months === 1 ? 'Monat' : 'Monaten'} lag die Zahl der Tage mit Akutmedikation über der empfohlenen Grenze (10 Tage für Triptane/Kombipräparate, 15 Tage für einfache Schmerzmittel). Besprich das bitte mit deiner Ärztin oder deinem Arzt.`,
    frequentTitle: 'Häufige Kopfschmerztage',
    frequentBody: (days: number) =>
      `Du hattest im Schnitt ${days.toFixed(1)} Kopfschmerztage pro Monat. Ab 15 Tagen im Monat spricht man von chronischem Kopfschmerz – ein guter Anlass für ein ärztliches Gespräch.`,
    triggerTitle: 'Auffälliger Auslöser',
    triggerBody: (name: string, share: number) =>
      `„${name}" war bei ${Math.round(share * 100)} % deiner Attacken notiert – der häufigste Eintrag in deinem Zeitraum.`,
    intenseTriggerTitle: 'Auslöser mit stärkeren Attacken',
    intenseTriggerBody: (name: string, delta: number) =>
      `Attacken mit „${name}" waren im Schnitt ${delta.toFixed(1)} Punkte intensiver als Attacken ohne diesen Auslöser.`,
    medTitle: 'Wirksamstes Akutmedikament',
    medBody: (name: string, rate: number) =>
      `„${name}" hat bei ${Math.round(rate * 100)} % der bewerteten Einnahmen geholfen.`,
    weakMedTitle: 'Medikament ohne verlässliche Wirkung',
    weakMedBody: (name: string, rate: number) =>
      `„${name}" hat nur bei ${Math.round(rate * 100)} % der bewerteten Einnahmen geholfen. Eine Alternative könnte sinnvoll sein.`,
    trendDownTitle: 'Positive Entwicklung',
    trendDownBody: (before: number, after: number) =>
      `Deine Kopfschmerztage sind von ${before} auf ${after} pro Monat gesunken.`,
    trendUpTitle: 'Zunehmende Häufigkeit',
    trendUpBody: (before: number, after: number) =>
      `Deine Kopfschmerztage sind von ${before} auf ${after} pro Monat gestiegen.`,
    weekdayTitle: 'Wochentag-Muster',
    weekdayBody: (day: string, share: number) =>
      `${share > 0 ? `${Math.round(share * 100)} % ` : ''}deiner Attacken beginnen am ${day}.`,
    streakTitle: 'Kopfschmerzfreie Serie',
    streakBody: (days: number) => `Du bist seit ${days} Tagen kopfschmerzfrei.`,
    emptyTitle: 'Noch zu wenig Daten',
    emptyBody:
      'Trage ein paar Attacken ein – ab etwa fünf Einträgen erkennt die Auswertung erste Muster.',
  },
  en: {
    mohTitle: 'Possible medication overuse',
    mohBody: (months: number) =>
      `In ${months} month${months === 1 ? '' : 's'} your acute medication days exceeded the recommended limit (10 days for triptans/combination drugs, 15 days for simple analgesics). Please discuss this with your doctor.`,
    frequentTitle: 'Frequent headache days',
    frequentBody: (days: number) =>
      `You averaged ${days.toFixed(1)} headache days per month. From 15 days a month headache is considered chronic – worth discussing with a doctor.`,
    triggerTitle: 'Notable trigger',
    triggerBody: (name: string, share: number) =>
      `"${name}" was recorded for ${Math.round(share * 100)}% of your attacks – the most frequent entry in this period.`,
    intenseTriggerTitle: 'Trigger linked to stronger attacks',
    intenseTriggerBody: (name: string, delta: number) =>
      `Attacks involving "${name}" were on average ${delta.toFixed(1)} points more intense than attacks without it.`,
    medTitle: 'Most effective acute medication',
    medBody: (name: string, rate: number) => `"${name}" helped in ${Math.round(rate * 100)}% of rated intakes.`,
    weakMedTitle: 'Medication with limited effect',
    weakMedBody: (name: string, rate: number) =>
      `"${name}" only helped in ${Math.round(rate * 100)}% of rated intakes. An alternative might be worth discussing.`,
    trendDownTitle: 'Positive trend',
    trendDownBody: (before: number, after: number) =>
      `Your headache days went down from ${before} to ${after} per month.`,
    trendUpTitle: 'Increasing frequency',
    trendUpBody: (before: number, after: number) =>
      `Your headache days went up from ${before} to ${after} per month.`,
    weekdayTitle: 'Weekday pattern',
    weekdayBody: (day: string, share: number) =>
      `${share > 0 ? `${Math.round(share * 100)}% ` : ''}of your attacks start on ${day}.`,
    streakTitle: 'Headache-free streak',
    streakBody: (days: number) => `You have been headache-free for ${days} days.`,
    emptyTitle: 'Not enough data yet',
    emptyBody: 'Log a few attacks – from about five entries the analysis starts to find patterns.',
  },
};

const WEEKDAY_NAMES = {
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

export function buildInsights(ctx: InsightContext): Insight[] {
  const { attacks, from, to, lang, labelFor } = ctx;
  const t = texts[lang];
  const scoped = filterRange(attacks, from, to);
  const insights: Insight[] = [];

  if (scoped.length < 3) {
    return [{ id: 'empty', level: 'info', title: t.emptyTitle, body: t.emptyBody }];
  }

  const moh = mohByMonth(scoped).filter((month) => month.level === 'risk');
  if (moh.length) {
    insights.push({ id: 'moh', level: 'critical', title: t.mohTitle, body: t.mohBody(moh.length) });
  }

  const summary = summarize(scoped, from, to);
  const perMonth = (summary.headacheDays / summary.daysInRange) * 30;
  if (perMonth >= 15) {
    insights.push({ id: 'frequent', level: 'warning', title: t.frequentTitle, body: t.frequentBody(perMonth) });
  }

  const series = monthlySeries(scoped, from, to);
  if (series.length >= 4) {
    const half = Math.floor(series.length / 2);
    const before = series.slice(0, half);
    const after = series.slice(half);
    const avg = (points: MonthPoint[]) =>
      points.reduce((sum, point) => sum + point.headacheDays, 0) / (points.length || 1);
    const beforeAvg = Math.round(avg(before));
    const afterAvg = Math.round(avg(after));
    if (afterAvg < beforeAvg) {
      insights.push({
        id: 'trend-down',
        level: 'positive',
        title: t.trendDownTitle,
        body: t.trendDownBody(beforeAvg, afterAvg),
      });
    } else if (afterAvg > beforeAvg) {
      insights.push({
        id: 'trend-up',
        level: 'warning',
        title: t.trendUpTitle,
        body: t.trendUpBody(beforeAvg, afterAvg),
      });
    }
  }

  const impacts = triggerImpact(scoped);
  if (impacts.length) {
    const top = impacts[0];
    insights.push({
      id: `trigger-${top.id}`,
      level: 'info',
      title: t.triggerTitle,
      body: t.triggerBody(labelFor('trigger', top.id), top.share),
    });
    const strongest = [...impacts].sort((a, b) => b.intensityDelta - a.intensityDelta)[0];
    if (strongest && strongest.intensityDelta >= 1 && strongest.id !== top.id) {
      insights.push({
        id: `trigger-delta-${strongest.id}`,
        level: 'info',
        title: t.intenseTriggerTitle,
        body: t.intenseTriggerBody(labelFor('trigger', strongest.id), strongest.intensityDelta),
      });
    }
  }

  const meds = medicationStats(scoped).filter(
    (med) => med.medClass !== 'preventive' && med.fullRelief + med.partialRelief + med.noRelief >= 3,
  );
  if (meds.length) {
    const best = [...meds].sort((a, b) => b.successRate - a.successRate)[0];
    if (best.successRate >= 0.6) {
      insights.push({
        id: `med-${best.name}`,
        level: 'positive',
        title: t.medTitle,
        body: t.medBody(best.name, best.successRate),
      });
    }
    const worst = [...meds].sort((a, b) => a.successRate - b.successRate)[0];
    if (worst.successRate <= 0.34 && worst.name !== best.name) {
      insights.push({
        id: `med-weak-${worst.name}`,
        level: 'warning',
        title: t.weakMedTitle,
        body: t.weakMedBody(worst.name, worst.successRate),
      });
    }
  }

  const weekdays = weekdayDistribution(scoped);
  const topWeekday = [...weekdays].sort((a, b) => b.count - a.count)[0];
  if (topWeekday && topWeekday.count >= 3 && topWeekday.count / scoped.length >= 0.25) {
    insights.push({
      id: 'weekday',
      level: 'info',
      title: t.weekdayTitle,
      body: t.weekdayBody(WEEKDAY_NAMES[lang][topWeekday.weekday], topWeekday.count / scoped.length),
    });
  }

  const streak = streaks(attacks);
  if (streak.currentFreeDays >= 7) {
    insights.push({
      id: 'streak',
      level: 'positive',
      title: t.streakTitle,
      body: t.streakBody(streak.currentFreeDays),
    });
  }

  return insights;
}

/** Colour ramp used by the calendar and the year heatmap. */
export function intensityColor(intensity: number): string {
  if (intensity <= 0) return 'transparent';
  if (intensity <= 2) return 'hsl(152 55% 62%)';
  if (intensity <= 4) return 'hsl(45 90% 60%)';
  if (intensity <= 6) return 'hsl(28 92% 58%)';
  if (intensity <= 8) return 'hsl(8 85% 58%)';
  return 'hsl(348 78% 45%)';
}

/** Readable text colour for a swatch painted with intensityColor(). */
export function intensityTextColor(intensity: number): string {
  return intensity <= 4 ? 'hsl(215 30% 12%)' : '#ffffff';
}

/** Short form for stat tiles where a full "6 Std. 9 min" would wrap. */
export function formatDurationShort(minutes: number | undefined, lang: 'de' | 'en'): string {
  if (!minutes || minutes <= 0) return '–';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  const value = hours < 10 ? hours.toFixed(1) : String(Math.round(hours));
  return lang === 'de' ? `${value.replace('.', ',')} Std.` : `${value} h`;
}

export function formatDuration(minutes: number | undefined, lang: 'de' | 'en'): string {
  if (!minutes || minutes <= 0) return '–';
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return lang === 'de' ? `${hours} Std.` : `${hours} h`;
  return lang === 'de' ? `${hours} Std. ${rest} min` : `${hours} h ${rest} min`;
}

export function lastNDaysRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = addDays(to, -(days - 1));
  return { from: format(from, ISO), to: format(to, ISO) };
}

export function monthRange(date: Date): { from: string; to: string } {
  const start = startOfMonth(date);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return { from: format(start, ISO), to: format(end, ISO) };
}
