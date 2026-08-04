import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/store/app-store';
import type { TranslationKey } from '@/lib/i18n';

export type RangeValue = '30' | '90' | '180' | '365' | 'all';

export const RANGE_OPTIONS: { value: RangeValue; label: TranslationKey; days: number }[] = [
  { value: '30', label: 'range.30', days: 30 },
  { value: '90', label: 'range.90', days: 90 },
  { value: '180', label: 'range.180', days: 180 },
  { value: '365', label: 'range.365', days: 365 },
  { value: 'all', label: 'range.all', days: 3650 },
];

export function rangeDays(value: RangeValue): number {
  return RANGE_OPTIONS.find((option) => option.value === value)?.days ?? 90;
}

interface RangeSelectProps {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  /** Options beyond this many days require Pro. */
  maxFreeDays?: number;
  onLockedPick?: () => void;
}

export function RangeSelect({ value, onChange, maxFreeDays, onLockedPick }: RangeSelectProps) {
  const { t, pro } = useApp();

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const days = rangeDays(next as RangeValue);
        if (!pro.active && maxFreeDays != null && days > maxFreeDays) {
          onLockedPick?.();
          return;
        }
        onChange(next as RangeValue);
      }}
    >
      <SelectTrigger className="h-9 w-[170px]" aria-label={t('range.label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((option) => {
          const locked = !pro.active && maxFreeDays != null && option.days > maxFreeDays;
          return (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                {t(option.label)}
                {locked && <span className="text-[10px] font-medium text-primary">{t('pro.badge')}</span>}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
