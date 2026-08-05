import React, { useMemo, useRef, useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ISO, countBy, formatDuration, intensityColor, intensityTextColor } from '@/lib/analytics';
import {
  KNOWN_MEDICATIONS,
  SYMPTOMS,
  TRIGGERS,
  guessMedicationClass,
  label as catalogLabel,
  resolveLabel,
  type CatalogItem,
} from '@/lib/catalog';
import { newId } from '@/lib/storage';
import { useApp } from '@/store/app-store';
import type { Attack, Effectiveness, HeadacheType, MedicationIntake } from '@/lib/types';
import { cn } from '@/lib/utils';

interface QuickEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  /** Called with the saved entry when the user asks for the full editor. */
  onOpenFullEditor: (attack: Attack) => void;
}

const STEP_COUNT = 6;
const DURATION_PRESETS = [30, 60, 120, 240, 480, 720, 1440];
const EFFECT_OPTIONS: Effectiveness[] = ['full', 'partial', 'none'];

/** Catalog options ordered by how often this person actually picked them. */
function useRankedOptions(catalog: CatalogItem[], pick: (attack: Attack) => string[]) {
  const { attacks, lang } = useApp();
  return useMemo(() => {
    const counts = new Map(countBy(attacks, pick).map((entry) => [entry.id, entry.count]));
    const known = catalog.map((item) => ({ id: item.id, label: catalogLabel(item, lang) }));
    const custom = [...counts.keys()]
      .filter((id) => !catalog.some((item) => item.id === id))
      .map((id) => ({ id, label: id }));
    return [...known, ...custom].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
    // `pick` is a stable module-level function in every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attacks, catalog, lang]);
}

const pickTriggers = (attack: Attack) => attack.triggers;
const pickSymptoms = (attack: Attack) => attack.symptoms;

function StepHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ChipGrid({
  options,
  selected,
  onToggle,
  limit,
  moreLabel,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  limit: number;
  moreLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded
    ? options
    : options.filter((option, index) => index < limit || selected.includes(option.id));

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((option) => {
        const active = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option.id)}
            className={cn(
              'rounded-full border px-4 py-2.5 text-[15px] transition-colors',
              active
                ? 'border-primary bg-primary/10 font-medium text-primary'
                : 'border-border bg-background text-foreground/80',
            )}
          >
            {option.label}
          </button>
        );
      })}
      {!expanded && options.length > limit && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-full border border-dashed px-4 py-2.5 text-[15px] text-muted-foreground"
        >
          {moreLabel}
        </button>
      )}
    </div>
  );
}

export function QuickEntrySheet({
  open,
  onOpenChange,
  defaultDate,
  onOpenFullEditor,
}: QuickEntrySheetProps) {
  const { t, lang, locale, attacks, saveAttack } = useApp();
  const today = format(new Date(), ISO);
  const advanceTimer = useRef<number>();

  const [step, setStep] = useState(0);
  const [date, setDate] = useState(defaultDate ?? today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [ongoing, setOngoing] = useState(false);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [medication, setMedication] = useState<{ name: string; doseMg?: number } | null>(null);
  const [effect, setEffect] = useState<Effectiveness>('unknown');
  const [notes, setNotes] = useState('');

  const triggerOptions = useRankedOptions(TRIGGERS, pickTriggers);
  const symptomOptions = useRankedOptions(SYMPTOMS, pickSymptoms);

  const medicationOptions = useMemo(() => {
    const seen = new Map<string, { name: string; doseMg?: number; count: number }>();
    for (const attack of attacks) {
      for (const med of attack.medications) {
        const key = `${med.name.toLowerCase()}|${med.doseMg ?? ''}`;
        const entry = seen.get(key);
        if (entry) entry.count += 1;
        else seen.set(key, { name: med.name, doseMg: med.doseMg, count: 1 });
      }
    }
    const used = [...seen.values()].sort((a, b) => b.count - a.count).slice(0, 6);
    if (used.length >= 3) return used;
    const fallback = KNOWN_MEDICATIONS.filter((med) =>
      ['Ibuprofen', 'Paracetamol', 'ASS / Aspirin', 'Naproxen', 'Sumatriptan', 'Metamizol'].includes(med.name),
    ).map((med) => ({ name: med.name, doseMg: med.defaultDose, count: 0 }));
    const merged = [...used];
    for (const item of fallback) {
      if (!merged.some((entry) => entry.name.toLowerCase() === item.name.toLowerCase())) merged.push(item);
    }
    return merged.slice(0, 6);
  }, [attacks]);

  const reset = () => {
    window.clearTimeout(advanceTimer.current);
    setStep(0);
    setDate(defaultDate ?? today);
    setShowDatePicker(false);
    setIntensity(null);
    setDuration(null);
    setOngoing(false);
    setTriggers([]);
    setSymptoms([]);
    setMedication(null);
    setEffect('unknown');
    setNotes('');
  };

  const close = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  /** Single-choice steps jump ahead on their own so a log is a few taps. */
  const autoAdvance = () => {
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => setStep((current) => Math.min(current + 1, STEP_COUNT - 1)), 180);
  };

  const toggle = (list: string[], setList: (next: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  /** Whatever this person logs most often — better than filing everything as "unclear". */
  const commonType = useMemo(() => {
    const counts = new Map<HeadacheType, number>();
    for (const attack of attacks) counts.set(attack.type, (counts.get(attack.type) ?? 0) + 1);
    const ranked = [...counts.entries()]
      .filter(([type]) => type !== 'other')
      .sort((a, b) => b[1] - a[1]);
    return ranked.length ? ranked[0][0] : ('other' as HeadacheType);
  }, [attacks]);

  const buildDraft = () => {
    const medications: MedicationIntake[] = medication
      ? [
          {
            id: newId(),
            name: medication.name,
            doseMg: medication.doseMg,
            medClass: guessMedicationClass(medication.name),
            effectiveness: effect,
          },
        ]
      : [];
    return {
      date,
      // Without a start time the time-of-day analysis would stay empty for
      // everyone who only ever logs from their phone.
      startTime: date === today ? format(new Date(), 'HH:mm') : undefined,
      durationMinutes: ongoing ? undefined : (duration ?? undefined),
      intensity: intensity ?? 5,
      type: commonType,
      aura: false,
      locations: [],
      qualities: [],
      symptoms,
      triggers,
      relief: [],
      impact: (intensity ?? 5) >= 8 ? ('severe' as const) : (intensity ?? 5) >= 6 ? ('moderate' as const) : ('mild' as const),
      medications,
      notes: notes.trim() || undefined,
    };
  };

  const save = (openEditor = false) => {
    const saved = saveAttack(buildDraft());
    toast.success(t('entry.saved'));
    close(false);
    if (openEditor) onOpenFullEditor(saved);
  };

  const canSave = intensity !== null;
  const isLast = step === STEP_COUNT - 1;
  /** The forward button only offers to skip while the current step is still empty. */
  const stepAnswered = [
    intensity !== null,
    duration !== null || ongoing,
    triggers.length > 0,
    symptoms.length > 0,
    true,
    true,
  ][step];

  const dateLabel =
    date === today
      ? t('quick.today')
      : date === format(subDays(new Date(), 1), ISO)
        ? t('quick.yesterday')
        : format(parseISO(date), 'EEE, d. MMM', { locale });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        className="flex h-[100dvh] max-h-none w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">{t('action.addLong')}</DialogTitle>

        <header className="flex items-center gap-2 border-b px-2 py-2">
          <Button variant="ghost" size="icon" aria-label={t('action.close')} onClick={() => close(false)}>
            <X className="h-5 w-5" />
          </Button>
          <span className="text-xs text-muted-foreground tabular">
            {t('quick.step', step + 1, STEP_COUNT)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5 text-primary disabled:opacity-40"
            disabled={!canSave}
            onClick={() => save()}
          >
            <Check className="h-4 w-4" />
            {t('action.save')}
          </Button>
        </header>

        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-6">
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: today, label: t('quick.today') },
                  { value: format(subDays(new Date(), 1), ISO), label: t('quick.yesterday') },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setDate(option.value);
                      setShowDatePicker(false);
                    }}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                      date === option.value && !showDatePicker
                        ? 'border-primary bg-primary/10 font-medium text-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowDatePicker((current) => !current)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                    showDatePicker ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                  )}
                >
                  {t('quick.otherDay')}
                </button>
              </div>
              {showDatePicker && (
                <Input
                  type="date"
                  max={today}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-12"
                />
              )}

              <StepHeading title={t('quick.howBad')} hint={t('entry.intensityHint')} />

              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => {
                  const active = intensity === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setIntensity(level);
                        autoAdvance();
                      }}
                      className={cn(
                        'flex h-14 items-center justify-center rounded-2xl border text-lg font-semibold tabular transition-all',
                        active ? 'border-transparent shadow-sm' : 'border-border bg-background',
                      )}
                      style={
                        active
                          ? { backgroundColor: intensityColor(level), color: intensityTextColor(level) }
                          : { color: intensityColor(level) }
                      }
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <StepHeading title={t('quick.howLong')} />
              <div className="grid grid-cols-2 gap-2.5">
                {DURATION_PRESETS.map((minutes) => {
                  const active = !ongoing && duration === minutes;
                  return (
                    <button
                      key={minutes}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setDuration(minutes);
                        setOngoing(false);
                        autoAdvance();
                      }}
                      className={cn(
                        'h-14 rounded-2xl border text-[15px] font-medium transition-colors',
                        active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background',
                      )}
                    >
                      {minutes < 60 ? t('quick.under1h') : formatDuration(minutes, lang)}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={ongoing}
                  onClick={() => {
                    setOngoing(true);
                    setDuration(null);
                    autoAdvance();
                  }}
                  className={cn(
                    'col-span-2 h-14 rounded-2xl border text-[15px] font-medium transition-colors',
                    ongoing ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background',
                  )}
                >
                  {t('quick.stillGoing')}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <StepHeading title={t('quick.triggers')} hint={t('common.optional')} />
              <ChipGrid
                options={triggerOptions}
                selected={triggers}
                onToggle={(id) => toggle(triggers, setTriggers, id)}
                limit={12}
                moreLabel={t('action.more')}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <StepHeading title={t('quick.symptoms')} hint={t('common.optional')} />
              <ChipGrid
                options={symptomOptions}
                selected={symptoms}
                onToggle={(id) => toggle(symptoms, setSymptoms, id)}
                limit={10}
                moreLabel={t('action.more')}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <StepHeading title={t('quick.meds')} />
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={medication === null}
                  onClick={() => {
                    setMedication(null);
                    setEffect('unknown');
                    autoAdvance();
                  }}
                  className={cn(
                    'col-span-2 rounded-2xl border px-4 py-4 text-[15px] font-medium transition-colors',
                    medication === null ? 'border-primary bg-primary/10 text-primary' : 'border-border',
                  )}
                >
                  {t('quick.noMed')}
                </button>
                {medicationOptions.map((med) => {
                  const active = medication?.name === med.name && medication?.doseMg === med.doseMg;
                  return (
                    <button
                      key={`${med.name}-${med.doseMg ?? ''}`}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setMedication({ name: med.name, doseMg: med.doseMg })}
                      className={cn(
                        'rounded-2xl border px-3 py-3.5 text-left text-[15px] transition-colors',
                        active ? 'border-primary bg-primary/10 text-primary' : 'border-border',
                      )}
                    >
                      <span className="block font-medium">{med.name}</span>
                      {med.doseMg != null && (
                        <span className="text-xs text-muted-foreground">{med.doseMg} mg</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {medication && (
                <div className="space-y-2.5 pt-2">
                  <p className="text-sm font-medium">{t('quick.effect')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {EFFECT_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={effect === option}
                        onClick={() => {
                          setEffect(option);
                          autoAdvance();
                        }}
                        className={cn(
                          'h-12 rounded-xl border text-sm transition-colors',
                          effect === option ? 'border-primary bg-primary/10 text-primary' : 'border-border',
                        )}
                      >
                        {t(`effect.${option}` as const)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <StepHeading title={t('quick.summary')} />
              <dl className="divide-y rounded-2xl border">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{t('entry.date')}</dt>
                  <dd className="text-sm font-medium">{dateLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{t('entry.intensity')}</dt>
                  <dd className="flex items-center gap-2 text-sm font-medium">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold tabular"
                      style={{
                        backgroundColor: intensityColor(intensity ?? 5),
                        color: intensityTextColor(intensity ?? 5),
                      }}
                    >
                      {intensity ?? 5}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{t('entry.duration')}</dt>
                  <dd className="text-sm font-medium">
                    {ongoing ? t('quick.stillGoing') : formatDuration(duration ?? undefined, lang)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <dt className="shrink-0 text-sm text-muted-foreground">{t('entry.triggers')}</dt>
                  <dd className="text-right text-sm font-medium">
                    {triggers.length
                      ? triggers.map((id) => resolveLabel(TRIGGERS, id, lang)).join(', ')
                      : t('quick.noneSelected')}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <dt className="shrink-0 text-sm text-muted-foreground">{t('entry.symptoms')}</dt>
                  <dd className="text-right text-sm font-medium">
                    {symptoms.length
                      ? symptoms.map((id) => resolveLabel(SYMPTOMS, id, lang)).join(', ')
                      : t('quick.noneSelected')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{t('entry.medications')}</dt>
                  <dd className="text-sm font-medium">
                    {medication
                      ? `${medication.name}${medication.doseMg ? ` ${medication.doseMg} mg` : ''}`
                      : t('quick.noMed')}
                  </dd>
                </div>
              </dl>

              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t('entry.notesPlaceholder')}
                rows={3}
              />

              <button
                type="button"
                onClick={() => save(true)}
                className="text-sm text-primary underline-offset-2 hover:underline"
              >
                {t('quick.allFields')} →
              </button>
            </div>
          )}
        </div>

        <footer className="flex items-center gap-3 border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {step > 0 && (
            <Button variant="ghost" size="lg" onClick={() => setStep((current) => current - 1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t('action.back')}
            </Button>
          )}
          <Button
            size="lg"
            className="ml-auto min-w-[9rem] gap-1.5"
            disabled={step === 0 && intensity === null}
            onClick={() => (isLast ? save() : setStep((current) => current + 1))}
          >
            {isLast ? (
              <>
                <Check className="h-4 w-4" />
                {t('action.save')}
              </>
            ) : (
              <>
                {step === 0 || stepAnswered ? t('action.next') : t('quick.skip')}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
