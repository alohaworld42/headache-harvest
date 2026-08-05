import React, { useMemo, useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RangeSelect, rangeDays, type RangeValue } from '@/components/common/RangeSelect';
import { ProGate } from '@/components/pro/ProGate';
import {
  ISO,
  filterRange,
  formatDuration,
  medicationStats,
  mohByMonth,
  summarize,
  triggerImpact,
} from '@/lib/analytics';
import { HEADACHE_TYPES, PAIN_QUALITIES, resolveLabel, label as catalogLabel } from '@/lib/catalog';
import { useApp } from '@/store/app-store';

export default function ReportPage({ onUpgrade }: { onUpgrade: () => void }) {
  const { t, attacks, settings, lang, locale, labelFor, pro } = useApp();
  const [range, setRange] = useState<RangeValue>('90');

  const days = rangeDays(range);
  const to = format(new Date(), ISO);
  const from = format(subDays(new Date(), days - 1), ISO);

  const scoped = useMemo(
    () => filterRange(attacks, from, to).sort((a, b) => a.date.localeCompare(b.date)),
    [attacks, from, to],
  );
  const summary = useMemo(() => summarize(attacks, from, to), [attacks, from, to]);
  const triggers = useMemo(() => triggerImpact(scoped, 1).slice(0, 6), [scoped]);
  const meds = useMemo(() => medicationStats(scoped), [scoped]);
  const moh = useMemo(() => mohByMonth(scoped).filter((month) => month.level !== 'ok'), [scoped]);

  const fmtDate = (iso: string) => format(parseISO(iso), 'P', { locale });

  // Only fields the user actually filled in reach the report.
  const historyRows = (
    [
      ['settings.historySince', settings.historySince],
      ['settings.historyConditions', settings.historyConditions],
      ['settings.historyPreventive', settings.historyPreventive],
      ['settings.historyWork', settings.historyWork],
      ['settings.historyFamily', settings.historyFamily],
    ] as const
  ).filter((row): row is [(typeof row)[0], string] => Boolean(row[1]?.trim()));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 print-hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('report.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('report.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <RangeSelect value={range} onChange={setRange} />
          {/* Without Pro the report itself is not rendered, so printing would
              produce a blank page — send the user to the paywall instead. */}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => (pro.active ? window.print() : onUpgrade())}
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">
              {pro.active ? t('action.print') : t('action.upgrade')}
            </span>
          </Button>
        </div>
      </header>

      <ProGate onUpgrade={onUpgrade}>
        <article className="surface print-page space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{t('report.title')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('report.patient')}: {settings.patientName || t('report.noName')}
                {settings.patientBirthDate ? ` · ${fmtDate(settings.patientBirthDate)}` : ''}
              </p>
            </div>
            <dl className="text-right text-sm">
              <div>
                <dt className="inline text-muted-foreground">{t('report.period')}: </dt>
                <dd className="inline tabular">
                  {fmtDate(from)} – {fmtDate(to)}
                </dd>
              </div>
              <div>
                <dt className="inline text-muted-foreground">{t('report.created')}: </dt>
                <dd className="inline tabular">{format(new Date(), 'P', { locale })}</dd>
              </div>
            </dl>
          </div>

          <section className="print-break">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">{t('report.summary')}</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <div className="text-muted-foreground">{t('dash.headacheDays')}</div>
                <div className="text-lg font-semibold tabular">
                  {summary.headacheDays}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}
                    / {summary.daysInRange}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('dash.attacks')}</div>
                <div className="text-lg font-semibold tabular">{summary.attackCount}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('dash.avgIntensity')}</div>
                <div className="text-lg font-semibold tabular">
                  {summary.avgIntensity ? summary.avgIntensity.toFixed(1) : '–'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('dash.medDays')}</div>
                <div className="text-lg font-semibold tabular">{summary.medicationDays}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('dash.avgDuration')}</div>
                <div className="text-lg font-semibold tabular">
                  {formatDuration(summary.avgDurationMinutes, lang)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('dash.severeDays')}</div>
                <div className="text-lg font-semibold tabular">{summary.severeDays}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t('entry.aura')}</div>
                <div className="text-lg font-semibold tabular">{Math.round(summary.auraShare * 100)}%</div>
              </div>
            </div>
          </section>

          {historyRows.length > 0 && (
            <section className="print-break">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">{t('report.history')}</h3>
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {historyRows.map(([labelKey, value]) => (
                  <div key={labelKey}>
                    <dt className="inline text-muted-foreground">{t(labelKey)}: </dt>
                    <dd className="inline">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {triggers.length > 0 && (
            <section className="print-break">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">
                {t('insights.triggers')}
              </h3>
              <p className="text-sm leading-relaxed">
                {triggers
                  .map(
                    (trigger) =>
                      `${labelFor('trigger', trigger.id)} (${trigger.count}×, ${Math.round(trigger.share * 100)} %)`,
                  )
                  .join(' · ')}
              </p>
            </section>
          )}

          {meds.length > 0 && (
            <section className="print-break">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">
                {t('insights.medication')}
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-1.5 pr-3 font-medium">{t('entry.medName')}</th>
                    <th className="py-1.5 pr-3 text-right font-medium">{t('insights.intakes')}</th>
                    <th className="py-1.5 pr-3 text-right font-medium">{t('dash.days')}</th>
                    <th className="py-1.5 text-right font-medium">{t('insights.successRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {meds.map((med) => (
                    <tr key={med.name} className="border-b last:border-0">
                      <td className="py-1.5 pr-3">{med.name}</td>
                      <td className="py-1.5 pr-3 text-right tabular">{med.intakes}</td>
                      <td className="py-1.5 pr-3 text-right tabular">{med.days}</td>
                      <td className="py-1.5 text-right tabular">
                        {med.fullRelief + med.partialRelief + med.noRelief
                          ? `${Math.round(med.successRate * 100)}%`
                          : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {moh.length > 0 && (
                <p className="mt-2 text-xs text-destructive">
                  {t('insights.moh')}: {moh.map((month) => month.key).join(', ')}
                </p>
              )}
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">{t('report.diary')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-1.5 pr-2 font-medium">{t('report.columns.date')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('report.columns.time')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('report.columns.duration')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('report.columns.intensity')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('report.columns.type')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('report.columns.quality')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('report.columns.symptoms')}</th>
                    <th className="py-1.5 pr-2 font-medium">{t('report.columns.triggers')}</th>
                    <th className="py-1.5 font-medium">{t('report.columns.medication')}</th>
                  </tr>
                </thead>
                <tbody>
                  {scoped.map((attack) => {
                    const type = HEADACHE_TYPES.find((item) => item.id === attack.type);
                    return (
                      <tr key={attack.id} className="border-b align-top last:border-0">
                        <td className="py-1.5 pr-2 tabular">{fmtDate(attack.date)}</td>
                        <td className="py-1.5 pr-2 tabular">{attack.startTime ?? '–'}</td>
                        <td className="py-1.5 pr-2 tabular">
                          {formatDuration(attack.durationMinutes, lang)}
                        </td>
                        <td className="py-1.5 pr-2 tabular">{attack.intensity}/10</td>
                        <td className="py-1.5 pr-2">{type ? catalogLabel(type, lang) : '–'}</td>
                        <td className="py-1.5 pr-2">
                          {attack.qualities.map((id) => resolveLabel(PAIN_QUALITIES, id, lang)).join(', ') ||
                            '–'}
                        </td>
                        <td className="py-1.5 pr-2">
                          {attack.symptoms.map((id) => labelFor('symptom', id)).join(', ') || '–'}
                        </td>
                        <td className="py-1.5 pr-2">
                          {attack.triggers.map((id) => labelFor('trigger', id)).join(', ') || '–'}
                        </td>
                        <td className="py-1.5">
                          {attack.medications
                            .map((med) => `${med.name}${med.doseMg ? ` ${med.doseMg} mg` : ''}`)
                            .join(', ') || '–'}
                        </td>
                      </tr>
                    );
                  })}
                  {!scoped.length && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-muted-foreground">
                        {t('insights.noData')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="border-t pt-3 text-xs text-muted-foreground">
            <strong className="font-medium">{t('report.disclaimerTitle')}: </strong>
            {t('report.disclaimer')}
          </section>
        </article>
      </ProGate>
    </div>
  );
}
