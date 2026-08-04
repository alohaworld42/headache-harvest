import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ChipSelect, type ChipOption } from '@/components/entry/ChipSelect';
import { intensityColor, intensityTextColor } from '@/lib/analytics';
import {
  HEADACHE_TYPES,
  IMPACTS,
  KNOWN_MEDICATIONS,
  LOCATIONS,
  MEDICATION_CLASSES,
  RELIEF,
  SYMPTOMS,
  TRIGGERS,
  guessMedicationClass,
  label as catalogLabel,
} from '@/lib/catalog';
import { newId } from '@/lib/storage';
import { useApp } from '@/store/app-store';
import type { Attack, Effectiveness, HeadacheType, Impact, MedicationIntake } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface EntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Entry being edited, or undefined for a new one. */
  attack?: Attack;
  /** Pre-selected date for new entries (yyyy-MM-dd). */
  defaultDate?: string;
  onUpgrade: () => void;
}

interface DraftState {
  date: string;
  startTime: string;
  durationHours: string;
  durationMinutes: string;
  intensity: number;
  type: HeadacheType;
  aura: boolean;
  locations: string[];
  symptoms: string[];
  triggers: string[];
  relief: string[];
  impact: Impact;
  medications: MedicationIntake[];
  sleepHours: string;
  stressLevel: string;
  menstruation: boolean;
  weatherChange: boolean;
  notes: string;
}

function toDraft(attack: Attack | undefined, defaultDate: string): DraftState {
  if (!attack) {
    return {
      date: defaultDate,
      startTime: '',
      durationHours: '',
      durationMinutes: '',
      intensity: 5,
      type: 'other',
      aura: false,
      locations: [],
      symptoms: [],
      triggers: [],
      relief: [],
      impact: 'moderate',
      medications: [],
      sleepHours: '',
      stressLevel: '',
      menstruation: false,
      weatherChange: false,
      notes: '',
    };
  }
  const total = attack.durationMinutes ?? 0;
  return {
    date: attack.date,
    startTime: attack.startTime ?? '',
    durationHours: total ? String(Math.floor(total / 60)) : '',
    durationMinutes: total % 60 ? String(total % 60) : '',
    intensity: attack.intensity,
    type: attack.type,
    aura: attack.aura,
    locations: attack.locations,
    symptoms: attack.symptoms,
    triggers: attack.triggers,
    relief: attack.relief,
    impact: attack.impact,
    medications: attack.medications,
    sleepHours: attack.sleepHours != null ? String(attack.sleepHours) : '',
    stressLevel: attack.stressLevel != null ? String(attack.stressLevel) : '',
    menstruation: Boolean(attack.menstruation),
    weatherChange: Boolean(attack.weatherChange),
    notes: attack.notes ?? '',
  };
}

const EFFECT_OPTIONS: Effectiveness[] = ['unknown', 'none', 'partial', 'full'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="section-title">{title}</h3>
      {children}
    </section>
  );
}

export function EntryDialog({ open, onOpenChange, attack, defaultDate, onUpgrade }: EntryDialogProps) {
  const { t, lang, settings, saveAttack, deleteAttack, updateSettings, pro } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const [draft, setDraft] = useState<DraftState>(() => toDraft(attack, defaultDate ?? today));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(toDraft(attack, defaultDate ?? today));
      setConfirmDelete(false);
    }
    // The draft is intentionally re-seeded only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attack?.id, defaultDate]);

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const toOptions = (items: { id: string; de: string; en: string }[], customs: string[]): ChipOption[] => [
    ...items.map((item) => ({ id: item.id, label: catalogLabel(item, lang) })),
    ...customs.map((custom) => ({ id: custom, label: custom })),
  ];

  const triggerOptions = useMemo(
    () => toOptions(TRIGGERS, settings.customTriggers),
    [lang, settings.customTriggers],
  );
  const symptomOptions = useMemo(
    () => toOptions(SYMPTOMS, settings.customSymptoms),
    [lang, settings.customSymptoms],
  );
  const locationOptions = useMemo(() => toOptions(LOCATIONS, []), [lang]);
  const reliefOptions = useMemo(() => toOptions(RELIEF, []), [lang]);

  const medicationSuggestions = useMemo(
    () => [...new Set([...KNOWN_MEDICATIONS.map((med) => med.name), ...settings.customMedications])],
    [settings.customMedications],
  );

  const addMedication = () => {
    setDraft((current) => ({
      ...current,
      medications: [
        ...current.medications,
        { id: newId(), name: '', medClass: 'other', effectiveness: 'unknown' },
      ],
    }));
  };

  const updateMedication = (id: string, patch: Partial<MedicationIntake>) => {
    setDraft((current) => ({
      ...current,
      medications: current.medications.map((med) => (med.id === id ? { ...med, ...patch } : med)),
    }));
  };

  const removeMedication = (id: string) => {
    setDraft((current) => ({
      ...current,
      medications: current.medications.filter((med) => med.id !== id),
    }));
  };

  const handleCustom = (kind: 'trigger' | 'symptom', value: string) => {
    if (!pro.active) return;
    if (kind === 'trigger') {
      if (settings.customTriggers.includes(value)) return;
      updateSettings({ customTriggers: [...settings.customTriggers, value] });
    } else {
      if (settings.customSymptoms.includes(value)) return;
      updateSettings({ customSymptoms: [...settings.customSymptoms, value] });
    }
  };

  const handleSave = () => {
    const hours = Number(draft.durationHours) || 0;
    const minutes = Number(draft.durationMinutes) || 0;
    const totalMinutes = hours * 60 + minutes;
    const medications = draft.medications
      .filter((med) => med.name.trim().length > 0)
      .map((med) => ({ ...med, name: med.name.trim() }));

    const unknownMeds = medications
      .map((med) => med.name)
      .filter(
        (name) =>
          !medicationSuggestions.some((suggestion) => suggestion.toLowerCase() === name.toLowerCase()),
      );
    if (unknownMeds.length && pro.active) {
      updateSettings({ customMedications: [...settings.customMedications, ...unknownMeds] });
    }

    saveAttack({
      id: attack?.id,
      date: draft.date,
      startTime: draft.startTime || undefined,
      durationMinutes: totalMinutes > 0 ? totalMinutes : undefined,
      intensity: draft.intensity,
      type: draft.type,
      aura: draft.aura || draft.type === 'migraine_aura',
      locations: draft.locations,
      symptoms: draft.symptoms,
      triggers: draft.triggers,
      relief: draft.relief,
      impact: draft.impact,
      medications,
      sleepHours: draft.sleepHours ? Number(draft.sleepHours) : undefined,
      stressLevel: draft.stressLevel ? Number(draft.stressLevel) : undefined,
      menstruation: settings.trackCycle ? draft.menstruation : undefined,
      weatherChange: draft.weatherChange,
      notes: draft.notes.trim() || undefined,
    });
    toast.success(attack ? t('entry.updated') : t('entry.saved'));
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!attack) return;
    deleteAttack(attack.id);
    toast.success(t('entry.deleted'));
    setConfirmDelete(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92dvh] gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="text-base">{attack ? t('entry.edit') : t('entry.new')}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[calc(92dvh-8.5rem)] space-y-6 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="entry-date">{t('entry.date')}</Label>
                <Input
                  id="entry-date"
                  type="date"
                  max={today}
                  value={draft.date}
                  onChange={(event) => set('date', event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entry-time">
                  {t('entry.startTime')}{' '}
                  <span className="text-xs font-normal text-muted-foreground">({t('common.optional')})</span>
                </Label>
                <Input
                  id="entry-time"
                  type="time"
                  value={draft.startTime}
                  onChange={(event) => set('startTime', event.target.value)}
                />
              </div>
            </div>

            <Section title={t('entry.intensity')}>
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => {
                  const active = draft.intensity === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => set('intensity', level)}
                      aria-label={`${t('entry.intensity')} ${level}`}
                      aria-pressed={active}
                      className={cn(
                        'flex h-10 items-center justify-center rounded-lg border text-sm font-medium tabular transition-all',
                        active
                          ? 'scale-105 border-transparent shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40',
                      )}
                      style={
                        active
                          ? { backgroundColor: intensityColor(level), color: intensityTextColor(level) }
                          : undefined
                      }
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{t('entry.intensityHint')}</p>
            </Section>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('entry.type')}</Label>
                <Select value={draft.type} onValueChange={(value) => set('type', value as HeadacheType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEADACHE_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {catalogLabel(type, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('entry.impact')}</Label>
                <Select value={draft.impact} onValueChange={(value) => set('impact', value as Impact)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPACTS.map((impact) => (
                      <SelectItem key={impact.id} value={impact.id}>
                        {catalogLabel(impact, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Section title={t('entry.duration')}>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={96}
                  inputMode="numeric"
                  value={draft.durationHours}
                  onChange={(event) => set('durationHours', event.target.value)}
                  className="w-20"
                  aria-label={t('entry.durationHours')}
                />
                <span className="text-sm text-muted-foreground">{t('entry.durationHours')}</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  inputMode="numeric"
                  value={draft.durationMinutes}
                  onChange={(event) => set('durationMinutes', event.target.value)}
                  className="w-20"
                  aria-label={t('entry.durationMinutes')}
                />
                <span className="text-sm text-muted-foreground">{t('entry.durationMinutes')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 4, 8, 12, 24].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    className={cn(
                      'chip',
                      Number(draft.durationHours) === hours && !draft.durationMinutes
                        ? 'chip-active'
                        : 'chip-idle',
                    )}
                    onClick={() => {
                      set('durationHours', String(hours));
                      set('durationMinutes', '');
                    }}
                  >
                    {hours} {lang === 'de' ? 'Std.' : 'h'}
                  </button>
                ))}
              </div>
            </Section>

            <Section title={t('entry.location')}>
              <ChipSelect
                options={locationOptions}
                value={draft.locations}
                onChange={(next) => set('locations', next)}
              />
            </Section>

            <Section title={t('entry.symptoms')}>
              <ChipSelect
                options={symptomOptions}
                value={draft.symptoms}
                onChange={(next) => set('symptoms', next)}
                collapseAfter={10}
                moreLabel={t('action.more')}
                allowCustom={pro.active}
                customPlaceholder={t('entry.customPlaceholder')}
                addLabel={t('entry.add')}
                onAddCustom={(value) => handleCustom('symptom', value)}
              />
            </Section>

            <Section title={t('entry.triggers')}>
              <ChipSelect
                options={triggerOptions}
                value={draft.triggers}
                onChange={(next) => set('triggers', next)}
                collapseAfter={12}
                moreLabel={t('action.more')}
                allowCustom={pro.active}
                customPlaceholder={t('entry.customPlaceholder')}
                addLabel={t('entry.add')}
                onAddCustom={(value) => handleCustom('trigger', value)}
              />
              {!pro.active && (
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="text-xs text-primary underline-offset-2 hover:underline"
                >
                  {t('pro.feature.custom')} →
                </button>
              )}
            </Section>

            <Section title={t('entry.medications')}>
              <datalist id="medication-suggestions">
                {medicationSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>

              <div className="space-y-3">
                {draft.medications.map((med) => (
                  <div key={med.id} className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex gap-2">
                      <Input
                        list="medication-suggestions"
                        value={med.name}
                        placeholder={t('entry.medName')}
                        onChange={(event) => {
                          const name = event.target.value;
                          updateMedication(med.id, {
                            name,
                            medClass: guessMedicationClass(name),
                            doseMg:
                              med.doseMg ??
                              KNOWN_MEDICATIONS.find(
                                (known) => known.name.toLowerCase() === name.trim().toLowerCase(),
                              )?.defaultDose,
                          });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t('action.delete')}
                        onClick={() => removeMedication(med.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Input
                        type="number"
                        min={0}
                        inputMode="decimal"
                        placeholder={t('entry.medDose')}
                        value={med.doseMg ?? ''}
                        onChange={(event) =>
                          updateMedication(med.id, {
                            doseMg: event.target.value ? Number(event.target.value) : undefined,
                          })
                        }
                      />
                      <Input
                        type="time"
                        value={med.time ?? ''}
                        onChange={(event) => updateMedication(med.id, { time: event.target.value })}
                      />
                      <Select
                        value={med.medClass}
                        onValueChange={(value) =>
                          updateMedication(med.id, { medClass: value as MedicationIntake['medClass'] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDICATION_CLASSES.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {catalogLabel(cls, lang)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={med.effectiveness}
                        onValueChange={(value) =>
                          updateMedication(med.id, { effectiveness: value as Effectiveness })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EFFECT_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {t(`effect.${option}` as const)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={addMedication} className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t('entry.addMedication')}
              </Button>
            </Section>

            <Section title={t('entry.relief')}>
              <ChipSelect
                options={reliefOptions}
                value={draft.relief}
                onChange={(next) => set('relief', next)}
                collapseAfter={8}
                moreLabel={t('action.more')}
              />
            </Section>

            <Section title={t('entry.context')}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="entry-sleep">{t('entry.sleepHours')}</Label>
                  <Input
                    id="entry-sleep"
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    inputMode="decimal"
                    value={draft.sleepHours}
                    onChange={(event) => set('sleepHours', event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="entry-stress">{t('entry.stress')}</Label>
                  <Input
                    id="entry-stress"
                    type="number"
                    min={0}
                    max={10}
                    inputMode="numeric"
                    value={draft.stressLevel}
                    onChange={(event) => set('stressLevel', event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-between rounded-xl border px-3 py-2.5">
                  <span className="text-sm">{t('entry.weather')}</span>
                  <Switch
                    checked={draft.weatherChange}
                    onCheckedChange={(checked) => set('weatherChange', checked)}
                  />
                </label>
                {settings.trackCycle && (
                  <label className="flex items-center justify-between rounded-xl border px-3 py-2.5">
                    <span className="text-sm">{t('entry.menstruation')}</span>
                    <Switch
                      checked={draft.menstruation}
                      onCheckedChange={(checked) => set('menstruation', checked)}
                    />
                  </label>
                )}
                <label className="flex items-center justify-between rounded-xl border px-3 py-2.5">
                  <span className="text-sm">{t('entry.aura')}</span>
                  <Switch checked={draft.aura} onCheckedChange={(checked) => set('aura', checked)} />
                </label>
              </div>
            </Section>

            <Section title={t('entry.notes')}>
              <Textarea
                value={draft.notes}
                onChange={(event) => set('notes', event.target.value)}
                placeholder={t('entry.notesPlaceholder')}
                rows={3}
              />
            </Section>
          </div>

          <div className="flex items-center gap-2 border-t px-5 py-3.5">
            {attack && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                {t('action.delete')}
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                <X className="mr-1.5 h-4 w-4 sm:hidden" />
                {t('action.cancel')}
              </Button>
              <Button type="button" onClick={handleSave}>
                {t('action.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('entry.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('entry.deleteConfirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('action.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
