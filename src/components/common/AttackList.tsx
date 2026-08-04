import React from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, Pill } from 'lucide-react';
import { formatDuration, intensityColor, intensityTextColor } from '@/lib/analytics';
import { HEADACHE_TYPES, label as catalogLabel } from '@/lib/catalog';
import { useApp } from '@/store/app-store';
import type { Attack } from '@/lib/types';

interface AttackListProps {
  attacks: Attack[];
  onSelect: (attack: Attack) => void;
  emptyLabel?: string;
  showDate?: boolean;
}

export function AttackList({ attacks, onSelect, emptyLabel, showDate = true }: AttackListProps) {
  const { lang, locale, labelFor } = useApp();

  if (!attacks.length) {
    return <p className="px-1 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y">
      {attacks.map((attack) => {
        const type = HEADACHE_TYPES.find((item) => item.id === attack.type);
        const chips = [...attack.triggers.slice(0, 2), ...attack.symptoms.slice(0, 1)];
        return (
          <li key={attack.id}>
            <button
              type="button"
              onClick={() => onSelect(attack)}
              className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular"
                style={{
                  backgroundColor: intensityColor(attack.intensity),
                  color: intensityTextColor(attack.intensity),
                }}
              >
                {attack.intensity}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  {showDate && (
                    <span className="text-sm font-medium">
                      {format(parseISO(attack.date), 'EEE, d. MMM yyyy', { locale })}
                    </span>
                  )}
                  {attack.startTime && (
                    <span className="text-xs text-muted-foreground tabular">{attack.startTime}</span>
                  )}
                  {type && <span className="text-xs text-muted-foreground">{catalogLabel(type, lang)}</span>}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {attack.durationMinutes != null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(attack.durationMinutes, lang)}
                    </span>
                  )}
                  {attack.medications.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Pill className="h-3 w-3" />
                      {attack.medications.map((med) => med.name).join(', ')}
                    </span>
                  )}
                  {chips.map((chip) => (
                    <span key={chip} className="rounded-full bg-muted px-2 py-0.5">
                      {labelFor('trigger', chip) !== chip ? labelFor('trigger', chip) : labelFor('symptom', chip)}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
