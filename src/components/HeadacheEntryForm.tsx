
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, CalendarIcon, Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HeadacheEntry } from '../types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HeadacheEntryFormProps {
  onSave: (entry: HeadacheEntry) => void;
  onCancel: () => void;
  existingEntry?: HeadacheEntry;
}

const HeadacheEntryForm: React.FC<HeadacheEntryFormProps> = ({ onSave, onCancel, existingEntry }) => {
  const [date, setDate] = useState<Date | undefined>(
    existingEntry ? new Date(existingEntry.date) : new Date()
  );
  const [intensity, setIntensity] = useState<number>(existingEntry?.intensity || 5);
  const [duration, setDuration] = useState<'short' | 'medium' | 'long'>(
    existingEntry?.duration || 'medium'
  );
  const [location, setLocation] = useState<string[]>(existingEntry?.location || []);
  const [newLocation, setNewLocation] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>(existingEntry?.symptoms || []);
  const [newSymptom, setNewSymptom] = useState('');
  const [triggers, setTriggers] = useState<string[]>(existingEntry?.triggers || []);
  const [newTrigger, setNewTrigger] = useState('');
  const [medications, setMedications] = useState<string[]>(existingEntry?.medications || []);
  const [newMedication, setNewMedication] = useState('');
  const [effectivenessRating, setEffectivenessRating] = useState<'ja' | 'nein' | 'wenig'>(
    existingEntry?.effectivenessRating || 'wenig'
  );
  const [notes, setNotes] = useState(existingEntry?.notes || '');

  const handleAddItem = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (!value.trim()) return;
    setter(prev => [...prev, value.trim()]);
    inputSetter('');
  };

  const handleRemoveItem = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Bitte wählen Sie ein Datum');
      return;
    }

    const entry: HeadacheEntry = {
      id: existingEntry?.id || `headache-${Date.now()}`,
      date: date.toISOString(),
      intensity,
      duration,
      location: location.length > 0 ? location : undefined,
      symptoms: symptoms.length > 0 ? symptoms : undefined,
      triggers: triggers.length > 0 ? triggers : undefined,
      medications: medications.length > 0 ? medications : undefined,
      effectivenessRating: medications.length > 0 ? effectivenessRating : undefined,
      notes: notes.trim() || undefined
    };

    onSave(entry);
    toast.success(existingEntry ? 'Eintrag aktualisiert' : 'Neuer Eintrag erstellt');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Datum</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'dd.MM.yyyy') : <span>Datum wählen</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Intensität ({intensity})</Label>
          <Slider
            value={[intensity]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => setIntensity(value[0])}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Leicht (1)</span>
            <span>Stark (10)</span>
          </div>
        </div>

        <div>
          <Label>Dauer</Label>
          <RadioGroup 
            value={duration} 
            onValueChange={(value) => setDuration(value as 'short' | 'medium' | 'long')}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="short" id="short" />
              <Label htmlFor="short" className="cursor-pointer">Kurz (&lt;6h)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="cursor-pointer">Mittel (6-12h)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="long" id="long" />
              <Label htmlFor="long" className="cursor-pointer">Lang (&gt;12h)</Label>
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label>Lokalisation</Label>
          <div className="flex mt-1">
            <Input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="z.B. einseitig, pulsierend..."
              className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              type="button"
              onClick={() => handleAddItem(newLocation, setLocation, setNewLocation)}
              className="rounded-l-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {location.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {location.map((item, index) => (
                <div key={index} className="bg-secondary text-foreground px-3 py-1 rounded-full flex items-center text-sm">
                  {item}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index, setLocation)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Symptome</Label>
          <div className="flex mt-1">
            <Input
              value={newSymptom}
              onChange={(e) => setNewSymptom(e.target.value)}
              placeholder="z.B. Übelkeit, Lichtscheu..."
              className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              type="button"
              onClick={() => handleAddItem(newSymptom, setSymptoms, setNewSymptom)}
              className="rounded-l-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {symptoms.map((item, index) => (
                <div key={index} className="bg-secondary text-foreground px-3 py-1 rounded-full flex items-center text-sm">
                  {item}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index, setSymptoms)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Auslöser</Label>
          <div className="flex mt-1">
            <Input
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              placeholder="z.B. Stress, Schlafmangel..."
              className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              type="button"
              onClick={() => handleAddItem(newTrigger, setTriggers, setNewTrigger)}
              className="rounded-l-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {triggers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {triggers.map((item, index) => (
                <div key={index} className="bg-secondary text-foreground px-3 py-1 rounded-full flex items-center text-sm">
                  {item}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index, setTriggers)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Medikamente</Label>
          <div className="flex mt-1">
            <Input
              value={newMedication}
              onChange={(e) => setNewMedication(e.target.value)}
              placeholder="z.B. Ibuprofen, Sumatriptan..."
              className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button 
              type="button"
              onClick={() => handleAddItem(newMedication, setMedications, setNewMedication)}
              className="rounded-l-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {medications.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {medications.map((item, index) => (
                <div key={index} className="bg-secondary text-foreground px-3 py-1 rounded-full flex items-center text-sm">
                  {item}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index, setMedications)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {medications.length > 0 && (
          <div>
            <Label>Wirksamkeit</Label>
            <RadioGroup 
              value={effectivenessRating} 
              onValueChange={(value) => setEffectivenessRating(value as 'ja' | 'nein' | 'wenig')}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ja" id="ja" />
                <Label htmlFor="ja" className="cursor-pointer">Ja</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wenig" id="wenig" />
                <Label htmlFor="wenig" className="cursor-pointer">Wenig</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nein" id="nein" />
                <Label htmlFor="nein" className="cursor-pointer">Nein</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div>
          <Label>Notizen</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Weitere Informationen zu diesem Kopfschmerz..."
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" className="bg-headache text-white hover:bg-headache/90">
          <Check className="mr-2 h-4 w-4" />
          {existingEntry ? 'Aktualisieren' : 'Speichern'}
        </Button>
      </div>
    </form>
  );
};

export default HeadacheEntryForm;
