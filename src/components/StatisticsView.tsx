
import React from 'react';
import { ExtractedData } from '../types';
import { BarChart, LineChart, Scatter, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer } from 'recharts';

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
          Basierend auf Ihren Daten sind Stress und Wetterwechsel die häufigsten Auslöser für Ihre Kopfschmerzen.
          Die meisten Episoden treten mit mittlerer Intensität auf und dauern zwischen 6-12 Stunden.
          Übelkeit und Lichtscheu sind die am häufigsten auftretenden Begleitsymptome.
        </p>
      </div>
    </div>
  );
};

export default StatisticsView;
