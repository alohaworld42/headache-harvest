import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttackList } from '@/components/common/AttackList';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { YearHeatmap } from '@/components/calendar/YearHeatmap';
import { ProGate } from '@/components/pro/ProGate';
import { ISO } from '@/lib/analytics';
import { useApp } from '@/store/app-store';
import type { Attack } from '@/lib/types';

interface CalendarPageProps {
  onNewEntry: (date: string) => void;
  onEditEntry: (attack: Attack) => void;
  onUpgrade: () => void;
}

export default function CalendarPage({ onNewEntry, onEditEntry, onUpgrade }: CalendarPageProps) {
  const { t, attacks, locale } = useApp();
  const [month, setMonth] = useState(() => new Date());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [selected, setSelected] = useState(() => format(new Date(), ISO));
  const [view, setView] = useState<'month' | 'year'>('month');

  const dayAttacks = useMemo(
    () => attacks.filter((attack) => attack.date === selected),
    [attacks, selected],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('cal.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('cal.subtitle')}</p>
        </div>
        <Tabs value={view} onValueChange={(value) => setView(value as 'month' | 'year')}>
          <TabsList className="h-9">
            <TabsTrigger value="month" className="text-xs">
              {t('cal.month')}
            </TabsTrigger>
            <TabsTrigger value="year" className="text-xs">
              {t('cal.year')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {view === 'month' ? (
        <MonthGrid
          month={month}
          onMonthChange={setMonth}
          attacks={attacks}
          selectedDate={selected}
          onSelectDate={setSelected}
        />
      ) : (
        <ProGate onUpgrade={onUpgrade}>
          <YearHeatmap
            year={year}
            onYearChange={setYear}
            attacks={attacks}
            onSelectDate={(date) => {
              setSelected(date);
              setMonth(parseISO(date));
              setView('month');
            }}
          />
        </ProGate>
      )}

      <section className="surface p-4 sm:p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">
            {t('cal.entriesOn', format(parseISO(selected), 'PPP', { locale }))}
          </h2>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onNewEntry(selected)}>
            <Plus className="h-4 w-4" />
            {t('action.add')}
          </Button>
        </div>
        <AttackList
          attacks={dayAttacks}
          onSelect={onEditEntry}
          emptyLabel={t('cal.noEntryDay')}
          showDate={false}
        />
      </section>
    </div>
  );
}
