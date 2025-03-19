
import React from 'react';
import { CalendarDays, PieChart, BarChart, Clock, ArrowRight } from 'lucide-react';
import { ExtractedData } from '../types';
import CalendarView from './CalendarView';
import StatisticsView from './StatisticsView';

interface DashboardSectionProps {
  data: ExtractedData | null;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({ data }) => {
  const [activeTab, setActiveTab] = React.useState<'calendar' | 'statistics'>('calendar');
  
  if (!data) return null;
  
  return (
    <div className="w-full max-w-5xl mx-auto mt-12 mb-16 animate-fade-up" style={{ animationDelay: '0.3s' }}>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Ihre Kopfschmerz-Daten</h2>
        <p className="text-muted-foreground">
          Analysiere und verstehe deine Kopfschmerzmuster für {data.monthYear}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-morphism rounded-xl p-5 flex flex-col">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 w-10 h-10 flex items-center justify-center mb-3">
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-sm text-muted-foreground">Monat</span>
          <span className="text-2xl font-semibold mt-1">{data.monthYear}</span>
        </div>
        
        <div className="glass-morphism rounded-xl p-5 flex flex-col">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/20 w-10 h-10 flex items-center justify-center mb-3">
            <BarChart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-sm text-muted-foreground">Kopfschmerztage</span>
          <span className="text-2xl font-semibold mt-1">{data.entries.length}</span>
        </div>
        
        <div className="glass-morphism rounded-xl p-5 flex flex-col">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 w-10 h-10 flex items-center justify-center mb-3">
            <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm text-muted-foreground">Durchschn. Intensität</span>
          <span className="text-2xl font-semibold mt-1">
            {(data.entries.reduce((sum, entry) => sum + entry.intensity, 0) / data.entries.length).toFixed(1)}
          </span>
        </div>
        
        <div className="glass-morphism rounded-xl p-5 flex flex-col">
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/20 w-10 h-10 flex items-center justify-center mb-3">
            <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm text-muted-foreground">Häufigste Dauer</span>
          <span className="text-2xl font-semibold mt-1 capitalize">
            {(() => {
              const durations = data.entries.map(e => e.duration);
              const counts: Record<string, number> = durations.reduce((acc, curr) => {
                acc[curr] = (acc[curr] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              
              const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
              switch(max) {
                case 'short': return 'Kurz';
                case 'medium': return 'Mittel';
                case 'long': return 'Lang';
                default: return 'Unbekannt';
              }
            })()}
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === 'calendar' 
                ? 'border-b-2 border-headache text-headache' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Kalenderansicht
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm flex items-center ${
              activeTab === 'statistics' 
                ? 'border-b-2 border-headache text-headache' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('statistics')}
          >
            <BarChart className="mr-2 h-4 w-4" />
            Statistiken
          </button>
        </div>
      </div>
      
      <div className="glass-morphism rounded-xl p-6">
        {activeTab === 'calendar' ? (
          <CalendarView data={data} />
        ) : (
          <StatisticsView data={data} />
        )}
      </div>
      
      <div className="mt-8 text-center">
        <button className="headache-btn bg-headache text-white inline-flex items-center">
          Vollständigen Bericht generieren
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DashboardSection;
