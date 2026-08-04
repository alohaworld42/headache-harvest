import { format } from 'date-fns';
import { LOCATIONS, RELIEF, SYMPTOMS, TRIGGERS, resolveLabel, type Lang } from './catalog';
import type { Attack } from './types';

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown, delimiter: string): string {
  const text = value == null ? '' : String(value);
  if (text.includes(delimiter) || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const HEADERS: Record<Lang, string[]> = {
  de: [
    'Datum',
    'Beginn',
    'Dauer (Min)',
    'Intensität',
    'Art',
    'Aura',
    'Lokalisation',
    'Symptome',
    'Auslöser',
    'Medikamente',
    'Wirkung',
    'Hilfreich',
    'Beeinträchtigung',
    'Schlaf (Std)',
    'Stress',
    'Menstruation',
    'Wetterwechsel',
    'Notizen',
  ],
  en: [
    'Date',
    'Start',
    'Duration (min)',
    'Intensity',
    'Type',
    'Aura',
    'Location',
    'Symptoms',
    'Triggers',
    'Medication',
    'Effect',
    'Relief',
    'Impairment',
    'Sleep (h)',
    'Stress',
    'Menstruation',
    'Weather change',
    'Notes',
  ],
};

export function attacksToCsv(attacks: Attack[], lang: Lang): string {
  const delimiter = lang === 'de' ? ';' : ',';
  const yes = lang === 'de' ? 'ja' : 'yes';
  const no = lang === 'de' ? 'nein' : 'no';
  const rows = [HEADERS[lang]];

  for (const attack of [...attacks].sort((a, b) => a.date.localeCompare(b.date))) {
    rows.push([
      attack.date,
      attack.startTime ?? '',
      attack.durationMinutes != null ? String(attack.durationMinutes) : '',
      String(attack.intensity),
      attack.type,
      attack.aura ? yes : no,
      attack.locations.map((id) => resolveLabel(LOCATIONS, id, lang)).join(', '),
      attack.symptoms.map((id) => resolveLabel(SYMPTOMS, id, lang)).join(', '),
      attack.triggers.map((id) => resolveLabel(TRIGGERS, id, lang)).join(', '),
      attack.medications
        .map((med) => `${med.name}${med.doseMg ? ` ${med.doseMg}mg` : ''}`)
        .join(', '),
      attack.medications.map((med) => med.effectiveness).join(', '),
      attack.relief.map((id) => resolveLabel(RELIEF, id, lang)).join(', '),
      attack.impact,
      attack.sleepHours != null ? String(attack.sleepHours) : '',
      attack.stressLevel != null ? String(attack.stressLevel) : '',
      attack.menstruation ? yes : '',
      attack.weatherChange ? yes : '',
      (attack.notes ?? '').replace(/\r?\n/g, ' '),
    ]);
  }

  const body = rows.map((row) => row.map((cell) => csvCell(cell, delimiter)).join(delimiter)).join('\r\n');
  // The BOM keeps umlauts intact when the file is opened in Excel.
  return `\uFEFF${body}`;
}

export function timestampedName(prefix: string, extension: string): string {
  return `${prefix}-${format(new Date(), 'yyyy-MM-dd')}.${extension}`;
}
