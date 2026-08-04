import React, { useMemo } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ISO, calendarIndex, intensityColor, intensityTextColor } from '@/lib/analytics';
import { useApp } from '@/store/app-store';
import type { Attack } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MonthGridProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  attacks: Attack[];
  selectedDate?: string;
  onSelectDate: (date: string) => void;
}

export function MonthGrid({ month, onMonthChange, attacks, selectedDate, onSelectDate }: MonthGridProps) {
  const { locale, t } = useApp();
  const index = useMemo(() => calendarIndex(attacks), [attacks]);
  const todayIso = format(new Date(), ISO);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, offset) =>
      format(new Date(start.getTime() + offset * 86_400_000), 'EEEEEE', { locale }),
    );
  }, [locale]);

  return (
    <div className="surface p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {format(month, 'MMMM yyyy', { locale })}
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => {
              onMonthChange(new Date());
              onSelectDate(todayIso);
            }}
          >
            {t('action.today')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t('action.back')}
            onClick={() => onMonthChange(addMonths(month, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t('action.next')}
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
        {weekdayLabels.map((day, i) => (
          <div key={`${day}-${i}`} className="pb-1.5">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = format(day, ISO);
          const cell = index.get(iso);
          const outside = !isSameMonth(day, month);
          const selected = selectedDate === iso;
          const future = iso > todayIso;

          return (
            <button
              key={iso}
              type="button"
              disabled={future}
              onClick={() => onSelectDate(iso)}
              aria-label={format(day, 'PPP', { locale })}
              aria-pressed={selected}
              className={cn(
                'relative flex h-11 flex-col items-center justify-center rounded-lg border text-sm transition-all sm:h-12',
                outside ? 'opacity-35' : '',
                future ? 'cursor-not-allowed opacity-25' : 'hover:border-primary/50',
                selected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : '',
                cell ? 'border-transparent font-semibold' : 'border-border bg-background',
                isToday(day) && !cell ? 'border-primary/60 font-semibold text-primary' : '',
              )}
              style={
                cell
                  ? {
                      backgroundColor: intensityColor(cell.maxIntensity),
                      color: intensityTextColor(cell.maxIntensity),
                    }
                  : undefined
              }
            >
              {format(day, 'd')}
              {cell && cell.attacks.length > 1 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {cell.attacks.slice(0, 3).map((attack) => (
                    <span
                      key={attack.id}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: 'currentColor', opacity: 0.7 }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{t('cal.low')}</span>
        <div className="flex flex-1 gap-1">
          {[1, 3, 5, 7, 9, 10].map((level) => (
            <span
              key={level}
              className="h-2 flex-1 rounded-full"
              style={{ backgroundColor: intensityColor(level) }}
            />
          ))}
        </div>
        <span>{t('cal.high')}</span>
      </div>
    </div>
  );
}
