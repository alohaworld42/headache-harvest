import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, CalendarIcon, Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { HeadacheEntry } from '../types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StepFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: HeadacheEntry) => void;
  selectedDate: Date;
  existingEntry?: HeadacheEntry;
}

const StepFormDialog: React.FC<StepFormDialogProps> = ({ 
  open, 
  onClose, 
  onSave, 
  selectedDate,
  existingEntry 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
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

  useEffect(() => {
    if (!open) return;
    setCurrentStep(0);
    setIntensity(existingEntry?.intensity ?? 5);
    setDuration(existingEntry?.duration ?? 'medium');
    setLocation(existingEntry?.location ?? []);
    setNewLocation('');
    setSymptoms(existingEntry?.symptoms ?? []);
    setNewSymptom('');
    setTriggers(existingEntry?.triggers ?? []);
    setNewTrigger('');
    setMedications(existingEntry?.medications ?? []);
    setNewMedication('');
    setEffectivenessRating(existingEntry?.effectivenessRating ?? 'wenig');
    setNotes(existingEntry?.notes ?? '');
  }, [open, existingEntry]);

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

  const steps = [
    {
      title: "Wie stark waren deine Kopfschmerzen?",
      content: (
        <div className="space-y-4">
          <div>
            <Label className="text-lg">Intensität ({intensity})</Label>
            <Slider
              value={[intensity]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value) => setIntensity(value[0])}
              className="mt-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Leicht (1)</span>
              <span>Stark (10)</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Wie lange haben die Kopfschmerzen angehalten?",
      content: (
        <div className="space-y-4">
          <Label className="text-lg">Dauer</Label>
          <RadioGroup 
            value={duration} 
            onValueChange={(value) => setDuration(value as 'short' | 'medium' | 'long')}
            className="flex flex-col space-y-3 mt-4"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="short" id="short" />
              <Label htmlFor="short" className="cursor-pointer text-base">Kurz (&lt;6h)</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium" className="cursor-pointer text-base">Mittel (6-12h)</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="long" id="long" />
              <Label htmlFor="long" className="cursor-pointer text-base">Lang (&gt;12h)</Label>
            </div>
          </RadioGroup>
        </div>
      )
    },
    {
      title: "Wo waren die Kopfschmerzen lokalisiert?",
      content: (
        <div className="space-y-4">
          <Label className="text-lg">Lokalisation</Label>
          <div className="flex mt-3">
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
            <div className="flex flex-wrap gap-2 mt-3">
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
      )
    },
    {
      title: "Welche Begleitsymptome hattest du?",
      content: (
        <div className="space-y-4">
          <Label className="text-lg">Symptome</Label>
          <div className="flex mt-3">
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
            <div className="flex flex-wrap gap-2 mt-3">
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
      )
    },
    {
      title: "Was könnte die Kopfschmerzen ausgelöst haben?",
      content: (
        <div className="space-y-4">
          <Label className="text-lg">Auslöser</Label>
          <div className="flex mt-3">
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
            <div className="flex flex-wrap gap-2 mt-3">
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
      )
    },
    {
      title: "Hast du Medikamente genommen?",
      content: (
        <div className="space-y-4">
          <Label className="text-lg">Medikamente</Label>
          <div className="flex mt-3">
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
            <div className="flex flex-wrap gap-2 mt-3">
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
      )
    },
    {
      title: medications.length > 0 ? "Wie gut haben die Medikamente geholfen?" : "Zusätzliche Notizen",
      content: medications.length > 0 ? (
        <div className="space-y-4">
          <Label className="text-lg">Wirksamkeit</Label>
          <RadioGroup 
            value={effectivenessRating} 
            onValueChange={(value) => setEffectivenessRating(value as 'ja' | 'nein' | 'wenig')}
            className="flex flex-col space-y-3 mt-4"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="ja" id="ja" />
              <Label htmlFor="ja" className="cursor-pointer text-base">Ja - gut geholfen</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="wenig" id="wenig" />
              <Label htmlFor="wenig" className="cursor-pointer text-base">Wenig - leichte Besserung</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="nein" id="nein" />
              <Label htmlFor="nein" className="cursor-pointer text-base">Nein - keine Besserung</Label>
            </div>
          </RadioGroup>
          
          <div className="mt-6">
            <Label className="text-lg">Notizen (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Weitere Informationen zu diesem Kopfschmerz..."
              className="mt-2"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Label className="text-lg">Notizen (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Weitere Informationen zu diesem Kopfschmerz..."
            className="mt-2"
          />
        </div>
      )
    }
  ];

  const commitPendingInput = () => {
    if (newLocation.trim()) {
      setLocation(prev => [...prev, newLocation.trim()]);
      setNewLocation('');
    }
    if (newSymptom.trim()) {
      setSymptoms(prev => [...prev, newSymptom.trim()]);
      setNewSymptom('');
    }
    if (newTrigger.trim()) {
      setTriggers(prev => [...prev, newTrigger.trim()]);
      setNewTrigger('');
    }
    if (newMedication.trim()) {
      setMedications(prev => [...prev, newMedication.trim()]);
      setNewMedication('');
    }
  };

  const handleNextStep = () => {
    commitPendingInput();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const finalLocation = newLocation.trim() ? [...location, newLocation.trim()] : location;
    const finalSymptoms = newSymptom.trim() ? [...symptoms, newSymptom.trim()] : symptoms;
    const finalTriggers = newTrigger.trim() ? [...triggers, newTrigger.trim()] : triggers;
    const finalMedications = newMedication.trim() ? [...medications, newMedication.trim()] : medications;

    const entry: HeadacheEntry = {
      id: existingEntry?.id || (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `headache-${Date.now()}-${Math.random().toString(36).slice(2)}`),
      date: selectedDate.toISOString(),
      intensity,
      duration,
      location: finalLocation.length > 0 ? finalLocation : undefined,
      symptoms: finalSymptoms.length > 0 ? finalSymptoms : undefined,
      triggers: finalTriggers.length > 0 ? finalTriggers : undefined,
      medications: finalMedications.length > 0 ? finalMedications : undefined,
      effectivenessRating: finalMedications.length > 0 ? effectivenessRating : undefined,
      notes: notes.trim() || undefined,
    };

    onSave(entry);
    toast.success(existingEntry ? 'Eintrag aktualisiert' : 'Neuer Eintrag erstellt');
    onClose();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 rounded-xl">
        <DialogTitle className="px-6 pt-6 pb-2">
          <div className="flex justify-between items-center">
            <span>
              {existingEntry ? 'Kopfschmerz bearbeiten' : 'Neuer Kopfschmerz-Eintrag'}
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {format(selectedDate, 'dd.MM.yyyy')}
            </span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full mt-4">
            <div 
              className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </DialogTitle>
        
        <div className="px-6 py-4">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {steps[currentStep].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {steps[currentStep].content}
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={handlePrevStep} 
                disabled={currentStep === 0}
                className="shadow-sm hover:shadow-md transition-all duration-300"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <Button 
                onClick={handleNextStep}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Fertig
                  </>
                ) : (
                  <>
                    Weiter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StepFormDialog;
