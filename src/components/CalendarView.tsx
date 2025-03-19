
import React from 'react';
import { ExtractedData } from '../types';

interface CalendarViewProps {
  data: ExtractedData;
}

const CalendarView: React.FC<CalendarViewProps> = ({ data }) => {
  const getDaysInMonth = (monthYear: string) => {
    const [month, year] = monthYear.split(' ');
    const monthMap: Record<string, number> = {
      'Januar': 0, 'Februar': 1, 'März': 2, 'April': 3, 'Mai': 4, 'Juni': 5,
      'Juli': 6, 'August': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Dezember': 11
    };
    
    const monthIndex = monthMap[month];
    const yearNum = parseInt(year);
    
    // Get last day of month
    const lastDay = new Date(yearNum, monthIndex + 1, 0).getDate();
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDayIndex = new Date(yearNum, monthIndex, 1).getDay();
    
    // Adjust for Monday as first day of week
    const firstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    return { lastDay, firstDay };
  };
  
  const getHeadacheIntensity = (day: number): number | null => {
    const dateString = data.entries.find(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getDate() === day;
    })?.intensity || null;
    
    return dateString;
  };
  
  const { lastDay, firstDay } = getDaysInMonth(data.monthYear);
  const daysArray = Array.from({ length: lastDay }, (_, i) => i + 1);
  
  // Fill with empty cells for days before the first day of month
  const placeholders = Array(firstDay).fill(null);
  
  // Get weekday names
  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  
  const getIntensityColor = (intensity: number | null): string => {
    if (intensity === null) return 'bg-transparent';
    
    if (intensity <= 3) return 'bg-green-100 dark:bg-green-900/30';
    if (intensity <= 6) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };
  
  const getIntensityTextColor = (intensity: number | null): string => {
    if (intensity === null) return '';
    
    if (intensity <= 3) return 'text-green-700 dark:text-green-400';
    if (intensity <= 6) return 'text-amber-700 dark:text-amber-400';
    return 'text-red-700 dark:text-red-400';
  };

  return (
    <div className="animate-fade-in">
      <h3 className="text-xl font-medium mb-6">{data.monthYear} - Kalendar</h3>
      
      <div className="grid grid-cols-7 gap-2">
        {weekdays.map(day => (
          <div key={day} className="text-center py-2 text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {placeholders.map((_, index) => (
          <div key={`placeholder-${index}`} className="aspect-square"></div>
        ))}
        
        {daysArray.map(day => {
          const intensity = getHeadacheIntensity(day);
          const intensityClass = getIntensityColor(intensity);
          const textColorClass = getIntensityTextColor(intensity);
          
          return (
            <div 
              key={day} 
              className={`aspect-square rounded-lg flex flex-col items-center justify-center relative ${
                intensity !== null ? 'shadow-sm' : ''
              } ${intensityClass}`}
            >
              <span className="text-sm">{day}</span>
              {intensity !== null && (
                <span className={`text-xs font-medium mt-1 ${textColorClass}`}>
                  {intensity}/10
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded-full"></div>
          <span className="text-sm">Leicht (1-3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-100 dark:bg-amber-900/30 rounded-full"></div>
          <span className="text-sm">Mittel (4-6)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded-full"></div>
          <span className="text-sm">Stark (7-10)</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
