import React, { useMemo, useState } from 'react';
import { format, startOfWeek, subDays } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { InsightCard } from '@/components/common/InsightCard';
import { RangeSelect, rangeDays, type RangeValue } from '@/components/common/RangeSelect';
import { ProGate } from '@/components/pro/ProGate';
import {
  ISO,
  buildInsights,
  countBy,
  filterRange,
  hourDistribution,
  medicationStats,
  mohByMonth,
  triggerImpact,
  weekdayDistribution,
} from '@/lib/analytics';
import { MEDICATION_CLASSES, label as catalogLabel } from '@/lib/catalog';
import { FREE_ANALYSIS_DAYS } from '@/lib/pro';
import { useApp } from '@/store/app-store';

const CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--popover))',
    fontSize: 12,
  },
  labelStyle: { color: 'hsl(var(--foreground))' },
};

function Panel({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="surface p-4 sm:p-5">
      <h2 className="text-sm font-medium">{title}</h2>
      {hint && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function InsightsPage({ onUpgrade }: { onUpgrade: () => void }) {
  const { t, attacks, lang, locale, labelFor } = useApp();
  const [range, setRange] = useState<RangeValue>('90');

  const days = rangeDays(range);
  const to = format(new Date(), ISO);
  const from = format(subDays(new Date(), days - 1), ISO);
  const scoped = useMemo(() => filterRange(attacks, from, to), [attacks, from, to]);

  const insights = useMemo(
    () => buildInsights({ attacks, from, to, lang, labelFor }),
    [attacks, from, to, lang, labelFor],
  );
  const triggers = useMemo(() => triggerImpact(scoped, 1), [scoped]);
  const symptoms = useMemo(() => countBy(scoped, (attack) => attack.symptoms), [scoped]);
  const weekdays = useMemo(() => weekdayDistribution(scoped), [scoped]);
  const hours = useMemo(() => hourDistribution(scoped), [scoped]);
  const meds = useMemo(() => medicationStats(scoped), [scoped]);
  const moh = useMemo(() => mohByMonth(scoped), [scoped]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, offset) =>
      format(new Date(start.getTime() + offset * 86_400_000), 'EEEEEE', { locale }),
    );
  }, [locale]);

  const weekdayData = weekdays.map((item) => ({ ...item, label: weekdayLabels[item.weekday] }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('insights.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('insights.subtitle')}</p>
        </div>
        <RangeSelect
          value={range}
          onChange={setRange}
          maxFreeDays={FREE_ANALYSIS_DAYS}
          onLockedPick={onUpgrade}
        />
      </header>

      {!scoped.length ? (
        <p className="surface p-8 text-center text-sm text-muted-foreground">{t('insights.noData')}</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="section-title">{t('insights.patterns')}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </section>

          <Panel title={t('insights.triggers')}>
            <div className="space-y-2.5">
              {triggers.slice(0, 8).map((trigger) => (
                <div key={trigger.id} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate">{labelFor('trigger', trigger.id)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular">
                      {trigger.count}× · {Math.round(trigger.share * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(4, trigger.share * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {!triggers.length && (
                <p className="py-4 text-center text-sm text-muted-foreground">{t('insights.noData')}</p>
              )}
            </div>

            {triggers.length > 0 && (
              <div className="mt-5">
                <ProGate onUpgrade={onUpgrade}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="py-2 pr-3 font-medium">{t('insights.trigger')}</th>
                          <th className="py-2 pr-3 text-right font-medium">{t('insights.attacks')}</th>
                          <th className="py-2 pr-3 text-right font-medium">{t('insights.avgIntensity')}</th>
                          <th className="py-2 text-right font-medium">{t('insights.effectDelta')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {triggers.map((trigger) => (
                          <tr key={trigger.id} className="border-b last:border-0">
                            <td className="py-2 pr-3">{labelFor('trigger', trigger.id)}</td>
                            <td className="py-2 pr-3 text-right tabular">{trigger.count}</td>
                            <td className="py-2 pr-3 text-right tabular">
                              {trigger.avgIntensity.toFixed(1)}
                            </td>
                            <td
                              className={`py-2 text-right tabular ${
                                trigger.intensityDelta > 0.5 ? 'text-destructive' : 'text-muted-foreground'
                              }`}
                            >
                              {trigger.intensityDelta > 0 ? '+' : ''}
                              {trigger.intensityDelta.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ProGate>
              </div>
            )}
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            <Panel title={t('insights.weekday')}>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={t('insights.time')}>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hours} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="bucket"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip {...CHART_TOOLTIP} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))">
                      {hours.map((entry) => (
                        <Cell key={entry.bucket} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <Panel title={t('insights.symptoms')}>
            <div className="flex flex-wrap gap-2">
              {symptoms.slice(0, 16).map((symptom) => (
                <span
                  key={symptom.id}
                  className="chip chip-idle"
                  style={{ opacity: 0.55 + Math.min(0.45, symptom.share) }}
                >
                  {labelFor('symptom', symptom.id)}
                  <span className="tabular text-xs text-muted-foreground">{symptom.count}</span>
                </span>
              ))}
              {!symptoms.length && (
                <p className="py-2 text-sm text-muted-foreground">{t('insights.noData')}</p>
              )}
            </div>
          </Panel>

          <ProGate onUpgrade={onUpgrade}>
            <Panel title={t('insights.medication')}>
              {meds.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">{t('entry.medName')}</th>
                        <th className="py-2 pr-3 font-medium">{t('entry.medClass')}</th>
                        <th className="py-2 pr-3 text-right font-medium">{t('insights.intakes')}</th>
                        <th className="py-2 text-right font-medium">{t('insights.successRate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meds.map((med) => {
                        const cls = MEDICATION_CLASSES.find((item) => item.id === med.medClass);
                        return (
                          <tr key={med.name} className="border-b last:border-0">
                            <td className="py-2 pr-3">{med.name}</td>
                            <td className="py-2 pr-3 text-muted-foreground">
                              {cls ? catalogLabel(cls, lang) : med.medClass}
                            </td>
                            <td className="py-2 pr-3 text-right tabular">{med.intakes}</td>
                            <td className="py-2 text-right tabular">
                              {med.fullRelief + med.partialRelief + med.noRelief
                                ? `${Math.round(med.successRate * 100)}%`
                                : '–'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">{t('insights.noData')}</p>
              )}
            </Panel>
          </ProGate>

          <ProGate onUpgrade={onUpgrade}>
            <Panel title={t('insights.moh')} hint={t('insights.mohHint')}>
              {moh.length ? (
                <div className="space-y-2">
                  {moh.map((month) => (
                    <div
                      key={month.key}
                      className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm"
                    >
                      <span className="w-20 shrink-0 tabular text-muted-foreground">{month.key}</span>
                      <span className="flex-1">
                        <span className="text-xs text-muted-foreground">{t('insights.mohDaysLow')}: </span>
                        <span className="tabular font-medium">{month.lowThresholdDays}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{t('insights.mohDaysHigh')}: </span>
                        <span className="tabular font-medium">{month.highThresholdDays}</span>
                      </span>
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          month.level === 'risk'
                            ? 'bg-destructive'
                            : month.level === 'watch'
                              ? 'bg-amber-500'
                              : 'bg-primary'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">{t('insights.noData')}</p>
              )}
            </Panel>
          </ProGate>
        </>
      )}
    </div>
  );
}
