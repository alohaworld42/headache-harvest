
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeadacheEntry } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getRandomColor } from '@/lib/utils';

const dummyHeadacheData: HeadacheEntry[] = [
  {
    id: '1',
    date: new Date(2023, 0, 5).toISOString(),
    intensity: 7,
    duration: 'long',
    location: ['Stirn', 'Schläfen'],
    symptoms: ['Übelkeit', 'Lichtempfindlichkeit'],
    triggers: ['Stress', 'Schlafmangel'],
    medications: ['Ibuprofen'],
    effectivenessRating: 'wenig',
    notes: 'Sehr starker Kopfschmerz nach langer Arbeit am Computer',
  },
  {
    id: '2',
    date: new Date(2023, 0, 12).toISOString(),
    intensity: 4,
    duration: 'medium',
    location: ['Hinterkopf'],
    symptoms: ['Nackenschmerzen'],
    triggers: ['schlechte Haltung'],
    medications: ['Paracetamol'],
    effectivenessRating: 'ja',
    notes: 'Besserte sich nach Ruhepause',
  },
  {
    id: '3',
    date: new Date(2023, 0, 18).toISOString(),
    intensity: 8,
    duration: 'long',
    location: ['einseitig links', 'pulsierend'],
    symptoms: ['Übelkeit', 'Erbrechen', 'Lichtempfindlichkeit'],
    triggers: ['Wetterwechsel'],
    medications: ['Sumatriptan'],
    effectivenessRating: 'ja',
    notes: 'Typische Migräne mit Aura',
  },
  {
    id: '4',
    date: new Date(2023, 0, 25).toISOString(),
    intensity: 3,
    duration: 'short',
    location: ['Stirn'],
    symptoms: ['leichte Übelkeit'],
    triggers: ['Koffein-Entzug'],
    medications: ['Ibuprofen'],
    effectivenessRating: 'ja',
    notes: 'Trat morgens nach dem Aufstehen auf',
  },
  {
    id: '5',
    date: new Date(2023, 0, 30).toISOString(),
    intensity: 6,
    duration: 'medium',
    location: ['Gesamter Kopf'],
    symptoms: ['Schwindelgefühl'],
    triggers: ['Alkohol'],
    medications: ['Aspirin'],
    effectivenessRating: 'wenig',
    notes: 'Nach Weinprobe am Vorabend',
  },
];

const AnalysisSection = () => {
  // Normally would use real data from props or context
  const headacheData = dummyHeadacheData;

  // Calculate intensity distribution
  const intensityData = [
    { name: 'Leicht (1-3)', value: headacheData.filter(d => d.intensity <= 3).length },
    { name: 'Mittel (4-6)', value: headacheData.filter(d => d.intensity >= 4 && d.intensity <= 6).length },
    { name: 'Stark (7-10)', value: headacheData.filter(d => d.intensity >= 7).length },
  ];

  // Calculate duration distribution
  const durationData = [
    { name: 'Kurz (<6h)', value: headacheData.filter(d => d.duration === 'short').length },
    { name: 'Mittel (6-12h)', value: headacheData.filter(d => d.duration === 'medium').length },
    { name: 'Lang (>12h)', value: headacheData.filter(d => d.duration === 'long').length },
  ];

  // Calculate medication effectiveness
  const effectivenessData = [
    { name: 'Wirksam', value: headacheData.filter(d => d.effectivenessRating === 'ja').length },
    { name: 'Wenig wirksam', value: headacheData.filter(d => d.effectivenessRating === 'wenig').length },
    { name: 'Unwirksam', value: headacheData.filter(d => d.effectivenessRating === 'nein').length },
  ];

  // Generate colors
  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Kopfschmerz-Analyse</h2>
      <p className="text-muted-foreground">Statistiken und Muster basierend auf Ihren bisherigen Einträgen.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Schmerzintensität</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={intensityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                >
                  {intensityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Schmerzdauer</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={durationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                >
                  {durationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Medikamenten-Wirksamkeit</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={effectivenessData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                >
                  {effectivenessData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisSection;
