import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatisticsView from '../components/StatisticsView';
import HeadacheCalendar from '../components/HeadacheCalendar';
import Footer from '../components/Footer';
import { HeadacheEntry, HeadacheEntryArraySchema } from '../types';
import { toast } from 'sonner';
import { BarChart } from 'lucide-react';

const STORAGE_KEY = 'headacheEntries';

function loadEntries(): HeadacheEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const result = HeadacheEntryArraySchema.safeParse(parsed);
    if (!result.success) {
      console.warn('Gespeicherte Daten haben ein unerwartetes Format, ignoriert.', result.error);
      return [];
    }
    return result.data;
  } catch (err) {
    console.warn('LocalStorage konnte nicht geladen werden:', err);
    return [];
  }
}

const Index = () => {
  const [entries, setEntries] = useState<HeadacheEntry[]>(loadEntries);
  const [activeView, setActiveView] = useState<'calendar' | 'statistics'>('calendar');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.error('Speichern fehlgeschlagen:', err);
      toast.error('Daten konnten nicht gespeichert werden.');
    }
  }, [entries]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header entries={entries} onReplaceEntries={setEntries} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Kopfschmerz-Tracking</h1>
            <p className="text-muted-foreground">
              Erfassen und analysieren Sie Ihre Kopfschmerzen, um Muster zu erkennen
            </p>
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
              <StatisticsView entries={entries} />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
