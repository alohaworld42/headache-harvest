import React, { useMemo } from 'react';
import { eachDayOfInterval, endOfYear, format, getMonth, startOfYear } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ISO, calendarIndex, intensityColor } from '@/lib/analytics';
import { useApp } from '@/store/app-store';
import type { Attack } from '@/lib/types';

interface YearHeatmapProps {
  year: number;
  onYearChange: (year: number) => void;
  attacks: Attack[];
  onSelectDate?: (date: string) => void;
}

export function YearHeatmap({ year, onYearChange, attacks, onSelectDate }: YearHeatmapProps) {
  const { locale, t } = useApp();
  const index = useMemo(() => calendarIndex(attacks), [attacks]);
  const todayIso = format(new Date(), ISO);

  const months = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfYear(new Date(year, 0, 1)),
      end: endOfYear(new Date(year, 0, 1)),
    });
    const grouped = new Map<number, Date[]>();
    for (const day of days) {
      const key = getMonth(day);
      const list = grouped.get(key);
      if (list) list.push(day);
      else grouped.set(key, [day]);
    }
    return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
  }, [year]);

  const yearDays = months.reduce((sum, [, days]) => sum + days.length, 0);
  const headacheDays = [...index.keys()].filter((iso) => iso.startsWith(String(year))).length;

  return (
    <div className="surface p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{t('cal.year')} {year}</h2>
        <span className="text-sm text-muted-foreground tabular">
          · {headacheDays} {t('dash.headacheDays').toLowerCase()} {t('dash.ofDays', yearDays)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onYearChange(year - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={year >= new Date().getFullYear()}
            onClick={() => onYearChange(year + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {months.map(([monthIndex, days]) => (
          <div key={monthIndex}>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">
              {format(days[0], 'MMMM', { locale })}
            </div>
            <div className="flex flex-wrap gap-[3px]">
              {days.map((day) => {
                const iso = format(day, ISO);
                const cell = index.get(iso);
                const future = iso > todayIso;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={future || !onSelectDate}
                    onClick={() => onSelectDate?.(iso)}
                    title={`${format(day, 'PPP', { locale })}${cell ? ` · ${cell.maxIntensity}/10` : ''}`}
                    className="h-3.5 w-3.5 rounded-[3px] border border-border/60 transition-transform hover:scale-125 disabled:opacity-40"
                    style={{
                      backgroundColor: cell ? intensityColor(cell.maxIntensity) : 'hsl(var(--muted))',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
