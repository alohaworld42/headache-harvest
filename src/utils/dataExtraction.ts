
import { ExtractedData, HeadacheEntry } from '../types';

/**
 * Extract structured data from processed image
 * This would use the OCR results in a real implementation
 */
export async function extractData(processedImageData: string): Promise<ExtractedData> {
  // In a real implementation, this would analyze the OCR output
  // and extract structured data from the calendar image
  
  // For demonstration purposes, we'll return mock data
  return {
    monthYear: "März 2024",
    entries: []
  };
}

/**
 * Parse month and year from calendar header
 */
export function parseMonthYear(headerText: string): { month: string; year: number } {
  // Example: Parse "MONAT: März 2024" into { month: "März", year: 2024 }
  try {
    const match = headerText.match(/MONAT:?\s+([a-zA-ZäöüÄÖÜß]+)\s+(\d{4})/i);
    if (match) {
      return {
        month: match[1],
        year: parseInt(match[2])
      };
    }
    
    // Fallback: try to extract just month and year without the label
    const fallbackMatch = headerText.match(/([a-zA-ZäöüÄÖÜß]+)\s+(\d{4})/);
    if (fallbackMatch) {
      return {
        month: fallbackMatch[1],
        year: parseInt(fallbackMatch[2])
      };
    }
    
    throw new Error("Could not parse month and year");
  } catch (error) {
    console.error("Error parsing month and year:", error);
    return {
      month: "Unknown",
      year: new Date().getFullYear()
    };
  }
}

/**
 * Extract intensity value from grid cell
 */
export function extractIntensity(cellValue: string): number {
  // Parse intensity markings - could be X, numbers, or other marks
  if (cellValue === "X" || cellValue.toLowerCase() === "stark") {
    return 8; // High intensity
  } else if (cellValue === "I" || cellValue.toLowerCase() === "mittel") {
    return 5; // Medium intensity
  } else if (cellValue === "✓" || cellValue.toLowerCase() === "leicht") {
    return 3; // Low intensity
  } else if (!isNaN(Number(cellValue))) {
    return Number(cellValue); // Numeric value
  }
  
  return 0; // Default
}

/**
 * Map symptoms from grid cells to structured data
 */
export function mapSymptoms(cells: any[]): string[] {
  const symptomMap: Record<string, string> = {
    "übelkeit": "Übelkeit",
    "erbrechen": "Erbrechen",
    "lichtscheu": "Lichtscheu",
    "lärmempf": "Lärmempfindlichkeit",
    "schwindel": "Schwindel",
    // Add more mappings as needed
  };
  
  const symptoms: string[] = [];
  
  cells.forEach(cell => {
    const lowerValue = cell.value.toLowerCase();
    
    // Check if the cell value matches any known symptom
    for (const [key, value] of Object.entries(symptomMap)) {
      if (lowerValue.includes(key) || lowerValue === "x" || lowerValue === "✓") {
        symptoms.push(value);
        break;
      }
    }
  });
  
  return symptoms;
}

/**
 * Map triggers from grid cells to structured data
 */
export function mapTriggers(cells: any[]): string[] {
  const triggerMap: Record<string, string> = {
    "stress": "Stress",
    "wetter": "Wetterwechsel",
    "schlaf": "Schlafmangel",
    "alkohol": "Alkoholische Getränke",
    "mens": "Menstruation",
    // Add more mappings as needed
  };
  
  const triggers: string[] = [];
  
  cells.forEach(cell => {
    const lowerValue = cell.value.toLowerCase();
    
    // Check if the cell value matches any known trigger
    for (const [key, value] of Object.entries(triggerMap)) {
      if (lowerValue.includes(key) || lowerValue === "x" || lowerValue === "✓") {
        triggers.push(value);
        break;
      }
    }
  });
  
  return triggers;
}
