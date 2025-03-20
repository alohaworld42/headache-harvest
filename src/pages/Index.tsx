
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CalendarView from '../components/CalendarView';
import StatisticsView from '../components/StatisticsView';
import HeadacheCalendar from '../components/HeadacheCalendar';
import Footer from '../components/Footer';
import { HeadacheEntry, ExtractedData } from '../types';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { BarChart } from 'lucide-react';

const Index = () => {
  const [entries, setEntries] = useState<HeadacheEntry[]>(() => {
    const savedEntries = localStorage.getItem('headacheEntries');
    return savedEntries ? JSON.parse(savedEntries) : [];
  });
  
  const [activeView, setActiveView] = useState<'calendar' | 'statistics'>('calendar');
  
  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('headacheEntries', JSON.stringify(entries));
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
  
  // Format data for StatisticsView
  const formattedData: ExtractedData = {
    monthYear: format(new Date(), 'MMMM yyyy', { locale: de }),
    entries: entries
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="w-full max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Kopfschmerz-Tracking</h1>
            <p className="text-muted-foreground">
              Erfassen und analysieren Sie Ihre Kopfschmerzen, um Muster zu erkennen
            </p>
          </div>
          
          <div className="mb-6">
            <div className="flex border-b">
              <button
                className={`px-4 py-2 font-medium text-sm flex items-center ${
                  activeView === 'calendar' 
                    ? 'border-b-2 border-headache text-headache' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveView('calendar')}
              >
                Kalender
              </button>
              
              <button
                className={`px-4 py-2 font-medium text-sm flex items-center ${
                  activeView === 'statistics' 
                    ? 'border-b-2 border-headache text-headache' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveView('statistics')}
              >
                <BarChart className="mr-2 h-4 w-4" />
                Statistiken
              </button>
            </div>
          </div>
          
          <div className="glass-morphism rounded-xl p-6">
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
