
import React from 'react';
import { ExtractedData } from '../types';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface StatisticsViewProps {
  data: ExtractedData;
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ data }) => {
  const intensityData = data.entries.map(entry => ({
    day: new Date(entry.date).getDate(),
    intensität: entry.intensity
  }));
  
  // Group by trigger
  const triggersCount: Record<string, number> = {};
  data.entries.forEach(entry => {
    if (entry.triggers) {
      entry.triggers.forEach(trigger => {
        triggersCount[trigger] = (triggersCount[trigger] || 0) + 1;
      });
    }
  });
  
  const triggerData = Object.entries(triggersCount).map(([name, value]) => ({ name, value }));
  
  // Group by symptom
  const symptomsCount: Record<string, number> = {};
  data.entries.forEach(entry => {
    if (entry.symptoms) {
      entry.symptoms.forEach(symptom => {
        symptomsCount[symptom] = (symptomsCount[symptom] || 0) + 1;
      });
    }
  });
  
  const symptomData = Object.entries(symptomsCount).map(([name, value]) => ({ name, value }));
  
  // Duration distribution
  const durationCount = {
    'Kurz (<6h)': 0,
    'Mittel (6-12h)': 0,
    'Lang (>12h)': 0
  };
  
  data.entries.forEach(entry => {
    if (entry.duration === 'short') durationCount['Kurz (<6h)']++;
    else if (entry.duration === 'medium') durationCount['Mittel (6-12h)']++;
    else if (entry.duration === 'long') durationCount['Lang (>12h)']++;
  });
  
  const durationData = Object.entries(durationCount).map(([name, value]) => ({ name, value }));

  // Empty state — no entries yet
  if (data.entries.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center text-center py-16">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium mb-2">Noch keine Einträge</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Füge im Kalender Kopfschmerz-Einträge hinzu, um Statistiken und Muster
          zu deinen Auslösern, Symptomen und der Intensität zu sehen.
        </p>
      </div>
    );
  }

  // Derive real insights from the data (replaces the previous hardcoded text)
  const topEntry = (counts: Record<string, number>): string | null => {
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  };
  const topTrigger = topEntry(triggersCount);
  const topSymptom = topEntry(symptomsCount);
  const avgIntensity =
    data.entries.reduce((sum, e) => sum + e.intensity, 0) / data.entries.length;
  const dominantDuration = durationData
    .slice()
    .sort((a, b) => b.value - a.value)[0];

  return (
    <div className="animate-fade-in">
      <h3 className="text-xl font-medium mb-6">{data.monthYear} - Statistiken</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
          <h4 className="text-lg font-medium mb-3">Intensität nach Tag</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intensityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="intensität" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-medium mb-3">Verteilung der Dauer</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-lg font-medium mb-3">Häufige Auslöser</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={triggerData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="text-lg font-medium mb-3">Begleitsymptome</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symptomData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Bar dataKey="value" fill="#ffa726" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
        <h4 className="font-medium mb-2">Analyse-Ergebnisse</h4>
        <p className="text-sm text-muted-foreground">
          Basierend auf {data.entries.length}{' '}
          {data.entries.length === 1 ? 'Eintrag' : 'Einträgen'}:{' '}
          {topTrigger
            ? `Häufigster Auslöser ist „${topTrigger}“. `
            : 'Es wurden noch keine Auslöser erfasst. '}
          {topSymptom
            ? `Häufigstes Begleitsymptom ist „${topSymptom}“. `
            : ''}
          Die durchschnittliche Schmerzintensität liegt bei {avgIntensity.toFixed(1)}/10
          {dominantDuration && dominantDuration.value > 0
            ? `, und die meisten Episoden fallen in die Kategorie „${dominantDuration.name}“.`
            : '.'}
        </p>
      </div>
    </div>
  );
};

export default StatisticsView;
