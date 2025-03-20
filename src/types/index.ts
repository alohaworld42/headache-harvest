export interface HeadacheEntry {
  id: string;
  date: string;
  intensity: number; // 1-10
  duration: 'short' | 'medium' | 'long'; // less than 6h, 6-12h, more than 12h
  location?: string[];
  symptoms?: string[];
  triggers?: string[];
  medications?: string[];
  effectivenessRating?: 'ja' | 'nein' | 'wenig'; // yes, no, little
  notes?: string;
}

export interface MonthData {
  month: string;
  year: number;
  entries: HeadacheEntry[];
}

export interface AnalysisResult {
  frequencyByDay: Record<number, number>;
  intensityAverage: number;
  commonTriggers: Record<string, number>;
  commonSymptoms: Record<string, number>;
  effectiveMedications: Record<string, number>;
  ineffectiveMedications: Record<string, number>;
  durationDistribution: Record<string, number>;
}

// Keeping this for compatibility with existing components
export interface ExtractedData {
  monthYear: string;
  entries: HeadacheEntry[];
}
