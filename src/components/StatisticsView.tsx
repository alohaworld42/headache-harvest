import React, { useMemo, useState } from 'react';
import { HeadacheEntry } from '../types';
import {
  BarChart,
  LineChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer,
} from 'recharts';
import {
  TimeRange,
  TIME_RANGE_LABELS,
  filterByRange,
  computeInsights,
  describeInsights,
} from '@/lib/insights';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface StatisticsViewProps {
  entries: HeadacheEntry[];
}

const WEEKDAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const StatisticsView: React.FC<StatisticsViewProps> = ({ entries }) => {
  const [range, setRange] = useState<TimeRange>('month');

  const filtered = useMemo(() => filterByRange(entries, range), [entries, range]);
  const insights = useMemo(() => computeInsights(filtered), [filtered]);

  const sortedByDate = useMemo(
    () => [...filtered].sort((a, b) => a.date.localeCompare(b.date)),
    [filtered],
  );

  const intensityData = sortedByDate.map(e => ({
    date: e.date.slice(0, 10),
    label: format(parseISO(e.date), 'dd.MM.', { locale: de }),
    intensität: e.intensity,
  }));

  const triggersCount: Record<string, number> = {};
  filtered.forEach(entry => {
    entry.triggers?.forEach(t => {
      triggersCount[t] = (triggersCount[t] ?? 0) + 1;
    });
  });
  const triggerData = Object.entries(triggersCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const symptomsCount: Record<string, number> = {};
  filtered.forEach(entry => {
    entry.symptoms?.forEach(s => {
      symptomsCount[s] = (symptomsCount[s] ?? 0) + 1;
    });
  });
  const symptomData = Object.entries(symptomsCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const durationCount = { 'Kurz (<6h)': 0, 'Mittel (6-12h)': 0, 'Lang (>12h)': 0 };
  filtered.forEach(entry => {
    if (entry.duration === 'short') durationCount['Kurz (<6h)']++;
    else if (entry.duration === 'medium') durationCount['Mittel (6-12h)']++;
    else if (entry.duration === 'long') durationCount['Lang (>12h)']++;
  });
  const durationData = Object.entries(durationCount).map(([name, value]) => ({ name, value }));

  const weekdayCount = [0, 0, 0, 0, 0, 0, 0];
  filtered.forEach(entry => {
    const dow = new Date(entry.date).getDay();
    weekdayCount[dow]++;
  });
  const weekdayData = WEEKDAY_NAMES.map((name, i) => ({ name, value: weekdayCount[i] }));

  const medStats: Record<string, { ja: number; wenig: number; nein: number }> = {};
  filtered.forEach(e => {
    if (!e.medications || !e.effectivenessRating) return;
    e.medications.forEach(med => {
      const stat = medStats[med] ?? (medStats[med] = { ja: 0, wenig: 0, nein: 0 });
      stat[e.effectivenessRating!]++;
    });
  });
  const medicationData = Object.entries(medStats)
    .map(([name, s]) => ({ name, Wirksam: s.ja, Mittel: s.wenig, Unwirksam: s.nein }))
    .sort((a, b) => (b.Wirksam + b.Mittel + b.Unwirksam) - (a.Wirksam + a.Mittel + a.Unwirksam))
    .slice(0, 8);

  const insightLines = describeInsights(insights);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Noch keine Einträge vorhanden. Lege im Kalender einen Eintrag an, um Statistiken zu sehen.
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xl font-medium">Statistiken</h3>
        <div className="inline-flex rounded-md border bg-background p-1">
          {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                range === r
                  ? 'bg-headache text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {TIME_RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Einträge im gewählten Zeitraum.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-medium mb-3">Intensitäts-Verlauf</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={intensityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="intensität" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-3">Verteilung der Dauer</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-3">Häufige Auslöser</h4>
              <div className="h-64">
                {triggerData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Keine Auslöser erfasst.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={triggerData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-3">Begleitsymptome</h4>
              <div className="h-64">
                {symptomData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Keine Symptome erfasst.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={symptomData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ffa726" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-3">Häufigkeit nach Wochentag</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-3">Medikamenten-Wirksamkeit</h4>
              <div className="h-64">
                {medicationData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Keine Medikamenten-Bewertungen erfasst.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={medicationData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Wirksam" stackId="a" fill="#22c55e" />
                      <Bar dataKey="Mittel" stackId="a" fill="#eab308" />
                      <Bar dataKey="Unwirksam" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <h4 className="font-medium mb-2">Analyse-Ergebnisse</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {insightLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticsView;
