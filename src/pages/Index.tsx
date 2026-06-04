
import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import StatisticsView from '../components/StatisticsView';
import HeadacheCalendar from '../components/HeadacheCalendar';
import Footer from '../components/Footer';
import { Button } from '@/components/ui/button';
import { HeadacheEntry, ExtractedData } from '../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { BarChart, Download, Upload } from 'lucide-react';

const isValidEntry = (entry: unknown): entry is HeadacheEntry =>
  typeof entry === 'object' &&
  entry !== null &&
  typeof (entry as HeadacheEntry).id === 'string' &&
  typeof (entry as HeadacheEntry).date === 'string' &&
  typeof (entry as HeadacheEntry).intensity === 'number';

const Index = () => {
  const [entries, setEntries] = useState<HeadacheEntry[]>(() => {
    const savedEntries = localStorage.getItem('headacheEntries');
    return savedEntries ? JSON.parse(savedEntries) : [];
  });
  
  const [activeView, setActiveView] = useState<'calendar' | 'statistics'>('calendar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('headacheEntries', JSON.stringify(entries));
  }, [entries]);

  const handleExport = () => {
    if (entries.length === 0) {
      toast.error('Keine Einträge zum Exportieren');
      return;
    }
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kopfschmerz-eintraege-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${entries.length} Einträge exportiert`);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed) || !parsed.every(isValidEntry)) {
          throw new Error('invalid format');
        }
        setEntries(parsed);
        toast.success(`${parsed.length} Einträge importiert`);
      } catch {
        toast.error('Ungültige Datei. Bitte eine exportierte JSON-Datei wählen.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // allow re-importing the same file
  };
  
  const handleAddEntry = (entry: HeadacheEntry) => {
    setEntries(prev => [...prev, entry]);
    toast.success('Kopfschmerz-Eintrag hinzugefügt');
  };
  
  const handleUpdateEntry = (updatedEntry: HeadacheEntry) => {
    setEntries(prev => prev.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ));
    toast.success('Kopfschmerz-Eintrag aktualisiert');
  };
  
  const handleDeleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
    toast.success('Kopfschmerz-Eintrag gelöscht');
  };
  
  const formattedData: ExtractedData = {
    monthYear: format(new Date(), 'MMMM yyyy', { locale: de }),
    entries: entries
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Kopfschmerz-Tracking</h1>
              <p className="text-muted-foreground">
                Erfassen und analysieren Sie Ihre Kopfschmerzen, um Muster zu erkennen
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Exportieren
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportClick}>
                <Upload className="h-4 w-4 mr-1" />
                Importieren
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>
          
          <nav className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center border-b-2 transition-colors ${
                activeView === 'calendar' 
                  ? 'border-headache text-headache' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveView('calendar')}
            >
              Kalender
            </button>
            
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeView === 'statistics' 
                  ? 'border-headache text-headache' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveView('statistics')}
            >
              <BarChart className="h-4 w-4" />
              Statistiken
            </button>
          </nav>
          
          <div className="bg-gradient-to-br from-background to-muted/50 border rounded-xl p-6 shadow-lg">
            {activeView === 'calendar' ? (
              <HeadacheCalendar 
                entries={entries}
                onAddEntry={handleAddEntry}
                onUpdateEntry={handleUpdateEntry}
                onDeleteEntry={handleDeleteEntry}
              />
            ) : (
              <StatisticsView data={formattedData} />
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
