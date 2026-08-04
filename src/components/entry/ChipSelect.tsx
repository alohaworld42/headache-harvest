import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ChipOption {
  id: string;
  label: string;
}

interface ChipSelectProps {
  options: ChipOption[];
  value: string[];
  onChange: (next: string[]) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  addLabel?: string;
  onAddCustom?: (value: string) => void;
  /** Shows only the first N options until the user expands the list. */
  collapseAfter?: number;
  moreLabel?: string;
}

export function ChipSelect({
  options,
  value,
  onChange,
  allowCustom = false,
  customPlaceholder,
  addLabel = 'Add',
  onAddCustom,
  collapseAfter,
  moreLabel = 'More',
}: ChipSelectProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');

  const selectedSet = new Set(value);
  const shouldCollapse = collapseAfter != null && !expanded && options.length > collapseAfter;
  const visible = shouldCollapse
    ? options.filter((option, index) => index < collapseAfter || selectedSet.has(option.id))
    : options;

  const toggle = (id: string) => {
    onChange(selectedSet.has(id) ? value.filter((item) => item !== id) : [...value, id]);
  };

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (!selectedSet.has(trimmed)) onChange([...value, trimmed]);
    onAddCustom?.(trimmed);
    setDraft('');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        {visible.map((option) => {
          const active = selectedSet.has(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option.id)}
              className={cn('chip', active ? 'chip-active' : 'chip-idle')}
            >
              {active && <Check className="h-3.5 w-3.5" />}
              {option.label}
            </button>
          );
        })}
        {shouldCollapse && (
          <button type="button" onClick={() => setExpanded(true)} className="chip chip-idle">
            <Plus className="h-3.5 w-3.5" />
            {moreLabel}
          </button>
        )}
      </div>

      {allowCustom && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustom();
              }
            }}
            placeholder={customPlaceholder}
            className="h-9"
          />
          <Button type="button" variant="secondary" size="sm" className="h-9" onClick={addCustom}>
            {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
