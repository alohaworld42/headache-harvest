import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { AlertTriangle, ArrowRight, CalendarPlus, ShieldCheck } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { AttackList } from '@/components/common/AttackList';
import { RangeSelect, rangeDays, type RangeValue } from '@/components/common/RangeSelect';
import { StatTile } from '@/components/common/StatTile';
import { ISO, formatDurationShort, mohByMonth, monthlySeries, streaks, summarize } from '@/lib/analytics';
import { FREE_ANALYSIS_DAYS } from '@/lib/pro';
import { useApp } from '@/store/app-store';
import type { Attack } from '@/lib/types';

interface DashboardProps {
  onNewEntry: () => void;
  onEditEntry: (attack: Attack) => void;
  onUpgrade: () => void;
}

/** Nag about backups once there is enough in the diary to be worth losing. */
const BACKUP_NAG_MIN_ENTRIES = 8;
const BACKUP_NAG_AFTER_DAYS = 45;

export default function Dashboard({ onNewEntry, onEditEntry, onUpgrade }: DashboardProps) {
  const { t, attacks, lang, locale, pro, settings, updateSettings } = useApp();
  const [range, setRange] = useState<RangeValue>('90');

  const daysSince = (iso?: string) =>
    iso ? (Date.now() - new Date(iso).getTime()) / 86_400_000 : Number.POSITIVE_INFINITY;
  const needsBackup =
    attacks.length >= BACKUP_NAG_MIN_ENTRIES &&
    daysSince(settings.lastBackupAt) > BACKUP_NAG_AFTER_DAYS &&
    daysSince(settings.backupReminderDismissedAt) > BACKUP_NAG_AFTER_DAYS;

  const days = rangeDays(range);
  const to = format(new Date(), ISO);
  const from = format(subDays(new Date(), days - 1), ISO);

  const summary = useMemo(() => summarize(attacks, from, to), [attacks, from, to]);
  const streak = useMemo(() => streaks(attacks), [attacks]);
  const series = useMemo(
    () => monthlySeries(attacks, from, to, locale),
    [attacks, from, to, locale],
  );
  const mohRisk = useMemo(() => mohByMonth(attacks).some((month) => month.level === 'risk'), [attacks]);
  const recent = useMemo(() => attacks.slice(0, 6), [attacks]);

  if (!attacks.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <CalendarPlus className="h-6 w-6 text-primary" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">{t('dash.noEntries')}</h1>
          <p className="max-w-sm text-sm text-muted-foreground">{t('dash.noEntriesHint')}</p>
        </div>
        <Button onClick={onNewEntry}>{t('action.addLong')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('dash.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('dash.subtitle')}</p>
        </div>
        <RangeSelect
          value={range}
          onChange={setRange}
          maxFreeDays={FREE_ANALYSIS_DAYS}
          onLockedPick={onUpgrade}
        />
      </header>

      {needsBackup && (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium">{t('backup.reminderTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('backup.reminderBody')}</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button size="sm" asChild>
              <Link to="/settings">{t('backup.reminderAction')}</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateSettings({ backupReminderDismissedAt: new Date().toISOString() })}
            >
              {t('backup.reminderDismiss')}
            </Button>
          </div>
        </div>
      )}

      {mohRisk && (
        <div className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('moh.warningTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('moh.warningBody')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label={t('dash.headacheDays')}
          value={summary.headacheDays}
          hint={t('dash.ofDays', summary.daysInRange)}
        />
        <StatTile label={t('dash.attacks')} value={summary.attackCount} />
        <StatTile
          label={t('dash.avgIntensity')}
          value={summary.avgIntensity ? summary.avgIntensity.toFixed(1) : '–'}
          hint="/ 10"
        />
        <StatTile
          label={t('dash.avgDuration')}
          value={formatDurationShort(summary.avgDurationMinutes, lang)}
        />
        <StatTile
          label={t('dash.medDays')}
          value={summary.medicationDays}
          accent={summary.medicationDays >= 10 ? 'warning' : 'default'}
          hint={t('dash.ofDays', summary.daysInRange)}
        />
        <StatTile
          label={t('dash.freeStreak')}
          value={`${streak.currentFreeDays}`}
          hint={t('dash.days')}
          accent={streak.currentFreeDays >= 7 ? 'positive' : 'default'}
        />
      </div>

      {series.length > 1 && (
        <section className="surface p-4 sm:p-5">
          <h2 className="mb-4 text-sm font-medium">{t('dash.trendDays')}</h2>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--popover))',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [value, t('dash.headacheDays')]}
                />
                <Area
                  type="monotone"
                  dataKey="headacheDays"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#trendFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="surface p-4 sm:p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-medium">{t('dash.recent')}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/calendar" className="gap-1 text-xs">
              {t('nav.calendar')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <AttackList attacks={recent} onSelect={onEditEntry} emptyLabel={t('dash.noEntries')} />
      </section>

      {!pro.active && (
        <button
          type="button"
          onClick={onUpgrade}
          className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
        >
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{t('pro.title')}</p>
            <p className="text-sm text-muted-foreground">{t('pro.subtitle')}</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-primary" />
        </button>
      )}

    </div>
  );
}
