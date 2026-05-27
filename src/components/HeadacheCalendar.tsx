import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, X, Plus, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import StepFormDialog from './StepFormDialog';
import { HeadacheEntry } from '../types';

interface HeadacheCalendarProps {
  entries: HeadacheEntry[];
  onAddEntry: (entry: HeadacheEntry) => void;
  onUpdateEntry: (entry: HeadacheEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

const getIntensityColor = (intensity: number): string => {
  if (intensity <= 3) return 'bg-green-100 dark:bg-green-900/30';
  if (intensity <= 6) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
};

const getIntensityTextColor = (intensity: number): string => {
  if (intensity <= 3) return 'text-green-700 dark:text-green-400';
  if (intensity <= 6) return 'text-amber-700 dark:text-amber-400';
  return 'text-red-700 dark:text-red-400';
};

const getDurationText = (duration: string): string => {
  switch (duration) {
    case 'short': return 'Kurz (<6h)';
    case 'medium': return 'Mittel (6-12h)';
    case 'long': return 'Lang (>12h)';
    default: return 'Unbekannt';
  }
};

const getEffectivenessText = (effectiveness: string): string => {
  switch (effectiveness) {
    case 'ja': return 'Wirksam';
    case 'wenig': return 'Wenig wirksam';
    case 'nein': return 'Unwirksam';
    default: return 'Keine Angabe';
  }
};

const HeadacheCalendar: React.FC<HeadacheCalendarProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayEntries, setDayEntries] = useState<HeadacheEntry[]>([]);
  const [isStepFormOpen, setIsStepFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HeadacheEntry | null>(null);
  const [isEntryDetailsOpen, setIsEntryDetailsOpen] = useState(false);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    format(new Date(2023, 0, 2 + i), 'EEEEEE', { locale: de }),
  );

  const getEntriesForDay = (day: Date) =>
    entries.filter(entry => isSameDay(new Date(entry.date), day));

  const handleDayClick = (day: Date) => {
    const entriesForDay = getEntriesForDay(day);
    setSelectedDate(day);

    if (entriesForDay.length > 0) {
      setDayEntries(entriesForDay);
      setSelectedEntry(entriesForDay[0]);
      setIsEntryDetailsOpen(true);
    } else {
      setSelectedEntry(null);
      setIsStepFormOpen(true);
    }
  };

  const handleAddNewEntry = () => {
    setSelectedDate(new Date());
    setSelectedEntry(null);
    setIsStepFormOpen(true);
    setIsEntryDetailsOpen(false);
  };

  const handleAddAdditionalForDay = () => {
    if (!selectedDate) return;
    setSelectedEntry(null);
    setIsStepFormOpen(true);
    setIsEntryDetailsOpen(false);
  };

  const handleEditEntry = () => {
    setIsStepFormOpen(true);
    setIsEntryDetailsOpen(false);
  };

  const handleDeleteEntry = () => {
    if (!selectedEntry) return;
    const remaining = dayEntries.filter(e => e.id !== selectedEntry.id);
    onDeleteEntry(selectedEntry.id);
    if (remaining.length > 0) {
      setDayEntries(remaining);
      setSelectedEntry(remaining[0]);
    } else {
      setIsEntryDetailsOpen(false);
    }
  };

  const handleSaveEntry = (entry: HeadacheEntry) => {
    if (selectedEntry) {
      onUpdateEntry(entry);
    } else {
      onAddEntry(entry);
    }
    setIsStepFormOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Kopfschmerz-Kalender
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth} aria-label="Vorheriger Monat">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[10ch] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextMonth} aria-label="Nächster Monat">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleAddNewEntry}
            className="ml-4 bg-headache text-white hover:bg-headache/90"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Neuer Eintrag
          </Button>
        </div>
      </div>

      <div className="glass-morphism rounded-xl p-4">
        <div className="grid grid-cols-7 gap-2">
          {weekdays.map((day, i) => (
            <div key={i} className="text-center py-2 text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {Array.from({ length: adjustedStartDay }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square"></div>
          ))}

          {daysInMonth.map((day) => {
            const cellEntries = getEntriesForDay(day);
            const hasEntry = cellEntries.length > 0;
            const intensityClass = hasEntry ? getIntensityColor(cellEntries[0].intensity) : '';
            const textColorClass = hasEntry ? getIntensityTextColor(cellEntries[0].intensity) : '';

            return (
              <button
                key={day.toString()}
                onClick={() => handleDayClick(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${
                  hasEntry ? 'shadow-sm cursor-pointer' : 'hover:bg-accent/50 cursor-pointer'
                } ${intensityClass}`}
              >
                <span className="text-sm">{format(day, 'd')}</span>
                {hasEntry && (
                  <span className={`text-xs font-medium mt-1 ${textColorClass}`}>
                    {cellEntries[0].intensity}/10
                  </span>
                )}
                {cellEntries.length > 1 && (
                  <span className="absolute bottom-1 right-1 bg-foreground text-background text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {cellEntries.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded-full"></div>
          <span>Leicht (1-3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-100 dark:bg-amber-900/30 rounded-full"></div>
          <span>Mittel (4-6)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded-full"></div>
          <span>Stark (7-10)</span>
        </div>
      </div>

      {selectedDate && (
        <StepFormDialog
          open={isStepFormOpen}
          onClose={() => setIsStepFormOpen(false)}
          onSave={handleSaveEntry}
          selectedDate={selectedDate}
          existingEntry={selectedEntry || undefined}
        />
      )}

      <Dialog open={isEntryDetailsOpen} onOpenChange={setIsEntryDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          {selectedEntry && (
            <>
              <DialogTitle className="flex justify-between items-center gap-2">
                <span>Kopfschmerz-Details</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleEditEntry}>
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteEntry}>
                    <X className="h-4 w-4 mr-1" />
                    Löschen
                  </Button>
                </div>
              </DialogTitle>

              {dayEntries.length > 1 && (
                <div className="flex flex-wrap gap-2 border-b pb-3">
                  {dayEntries.map((e, idx) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEntry(e)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        selectedEntry.id === e.id
                          ? 'bg-headache text-white border-headache'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Eintrag {idx + 1} · {e.intensity}/10
                    </button>
                  ))}
                  <button
                    onClick={handleAddAdditionalForDay}
                    className="px-3 py-1 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    Weiterer Eintrag
                  </button>
                </div>
              )}

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Datum</p>
                    <p className="font-medium">{format(new Date(selectedEntry.date), 'dd.MM.yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Intensität</p>
                    <p className={`font-medium ${getIntensityTextColor(selectedEntry.intensity)}`}>
                      {selectedEntry.intensity}/10
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Dauer</p>
                  <p className="font-medium">{getDurationText(selectedEntry.duration)}</p>
                </div>

                {selectedEntry.location && selectedEntry.location.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lokalisation</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEntry.location.map((item, i) => (
                        <span key={i} className="bg-secondary text-foreground px-2 py-0.5 rounded-full text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntry.symptoms && selectedEntry.symptoms.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Symptome</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEntry.symptoms.map((item, i) => (
                        <span key={i} className="bg-secondary text-foreground px-2 py-0.5 rounded-full text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntry.triggers && selectedEntry.triggers.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Auslöser</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEntry.triggers.map((item, i) => (
                        <span key={i} className="bg-secondary text-foreground px-2 py-0.5 rounded-full text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntry.medications && selectedEntry.medications.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Medikamente</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedEntry.medications.map((item, i) => (
                        <span key={i} className="bg-secondary text-foreground px-2 py-0.5 rounded-full text-xs">
                          {item}
                        </span>
                      ))}
                    </div>
                    {selectedEntry.effectivenessRating && (
                      <p className="text-sm mt-1">
                        Wirksamkeit: <span className="font-medium">{getEffectivenessText(selectedEntry.effectivenessRating)}</span>
                      </p>
                    )}
                  </div>
                )}

                {selectedEntry.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notizen</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedEntry.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeadacheCalendar;
