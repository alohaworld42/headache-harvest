
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, X, Plus, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import HeadacheEntryForm from './HeadacheEntryForm';
import StepFormDialog from './StepFormDialog';
import { HeadacheEntry } from '../types';

interface HeadacheCalendarProps {
  entries: HeadacheEntry[];
  onAddEntry: (entry: HeadacheEntry) => void;
  onUpdateEntry: (entry: HeadacheEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

const HeadacheCalendar: React.FC<HeadacheCalendarProps> = ({
  entries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStepFormOpen, setIsStepFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HeadacheEntry | null>(null);
  const [isEntryDetailsOpen, setIsEntryDetailsOpen] = useState(false);

  const handlePreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get startDay (0-6, 0 is Sunday)
  const startDay = monthStart.getDay();
  // Adjust for Monday as first day (0-6, 0 is Monday)
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

  // Create array for weekday headers (Mo, Di, Mi, ...)
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const day = (i + 1) % 7; // Start with Monday (1) and wrap around to Sunday (0)
    return format(new Date(2023, 0, day + 2), 'EEEEEE', { locale: de }); // Using 2023-01-02 (Monday) as reference
  });

  const getEntriesForDay = (day: Date) => {
    return entries.filter(entry => isSameDay(new Date(entry.date), day));
  };

  const handleDayClick = (day: Date) => {
    const dayEntries = getEntriesForDay(day);
    setSelectedDate(day);
    
    if (dayEntries.length > 0) {
      setSelectedEntry(dayEntries[0]); // Show first entry if multiple exist
      setIsEntryDetailsOpen(true);
    } else {
      handleAddNewEntryWithSteps(day);
    }
  };

  const handleAddNewEntry = (day: Date = new Date()) => {
    setSelectedDate(day);
    setSelectedEntry(null);
    setIsFormOpen(true);
    setIsEntryDetailsOpen(false);
  };

  const handleAddNewEntryWithSteps = (day: Date = new Date()) => {
    setSelectedDate(day);
    setSelectedEntry(null);
    setIsStepFormOpen(true);
    setIsEntryDetailsOpen(false);
  };

  const handleEditEntryWithSteps = () => {
    setIsStepFormOpen(true);
    setIsEntryDetailsOpen(false);
  };

  const handleEditEntry = () => {
    setIsFormOpen(true);
    setIsEntryDetailsOpen(false);
  };

  const handleDeleteEntry = () => {
    if (selectedEntry) {
      onDeleteEntry(selectedEntry.id);
      setIsEntryDetailsOpen(false);
    }
  };

  const handleSaveEntry = (entry: HeadacheEntry) => {
    if (selectedEntry) {
      onUpdateEntry(entry);
    } else {
      onAddEntry(entry);
    }
    setIsFormOpen(false);
    setIsStepFormOpen(false);
  };

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
    switch(duration) {
      case 'short': return 'Kurz (<6h)';
      case 'medium': return 'Mittel (6-12h)';
      case 'long': return 'Lang (>12h)';
      default: return 'Unbekannt';
    }
  };

  const getEffectivenessText = (effectiveness: string): string => {
    switch(effectiveness) {
      case 'ja': return 'Wirksam';
      case 'wenig': return 'Wenig wirksam';
      case 'nein': return 'Unwirksam';
      default: return 'Keine Angabe';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Kopfschmerz-Kalender
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            onClick={() => handleAddNewEntryWithSteps()} 
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
          {/* Weekday headers */}
          {weekdays.map((day, i) => (
            <div key={i} className="text-center py-2 text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          
          {/* Empty cells for days before the start of month */}
          {Array.from({ length: adjustedStartDay }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square"></div>
          ))}
          
          {/* Days of the month */}
          {daysInMonth.map((day) => {
            const dayEntries = getEntriesForDay(day);
            const hasEntry = dayEntries.length > 0;
            const intensityClass = hasEntry ? getIntensityColor(dayEntries[0].intensity) : '';
            const textColorClass = hasEntry ? getIntensityTextColor(dayEntries[0].intensity) : '';
            
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
                    {dayEntries[0].intensity}/10
                  </span>
                )}
                {dayEntries.length > 1 && (
                  <span className="absolute bottom-1 right-1 bg-foreground text-background text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {dayEntries.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center gap-6 text-sm">
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

      {/* New Entry Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {selectedEntry ? 'Kopfschmerz bearbeiten' : 'Neuer Kopfschmerz-Eintrag'}
          </DialogTitle>
          <HeadacheEntryForm 
            onSave={handleSaveEntry}
            onCancel={() => setIsFormOpen(false)}
            existingEntry={selectedEntry || undefined}
          />
        </DialogContent>
      </Dialog>

      {/* New Step Form Dialog */}
      {selectedDate && (
        <StepFormDialog
          open={isStepFormOpen}
          onClose={() => setIsStepFormOpen(false)}
          onSave={handleSaveEntry}
          selectedDate={selectedDate}
          existingEntry={selectedEntry || undefined}
        />
      )}

      {/* Entry Details Dialog */}
      <Dialog open={isEntryDetailsOpen} onOpenChange={setIsEntryDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedEntry && (
            <>
              <DialogTitle className="flex justify-between items-center">
                <span>Kopfschmerz-Details</span>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleEditEntryWithSteps}>
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDeleteEntry}>
                    <X className="h-4 w-4 mr-1" />
                    Löschen
                  </Button>
                </div>
              </DialogTitle>
              
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
                    <p className="text-sm mt-1">{selectedEntry.notes}</p>
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
