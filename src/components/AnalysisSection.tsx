
import React, { useState, useEffect } from 'react';
import { Calendar, Check, Loader2, BarChart2, Download } from 'lucide-react';
import { ExtractedData } from '../types';
import { processImage } from '../utils/imageProcessing';
import { extractData } from '../utils/dataExtraction';

interface AnalysisSectionProps {
  imageFile: File | null;
  onDataExtracted: (data: ExtractedData) => void;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ imageFile, onDataExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [monthDetected, setMonthDetected] = useState<string>('');
  const [entriesCount, setEntriesCount] = useState(0);

  useEffect(() => {
    if (imageFile) {
      analyzeImage(imageFile);
    }
  }, [imageFile]);

  const analyzeImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setAnalysisComplete(false);

    try {
      // Simulate OCR and image processing with progress updates
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setProgress(30);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Simulate processing the image
      const processedData = await processImage(file);
      
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Extract data from processed image
      const extractedData = await extractData(processedData);
      
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Mock data for demonstration
      const mockData: ExtractedData = {
        monthYear: 'März 2024',
        entries: [
          {
            id: '1',
            date: '2024-03-05',
            intensity: 7,
            duration: 'medium',
            location: ['pulsierend', 'einseitig'],
            symptoms: ['Übelkeit', 'Lichtscheu'],
            triggers: ['Stress'],
            medications: ['Ibuprofen'],
            effectivnessRating: 'ja'
          },
          {
            id: '2',
            date: '2024-03-12',
            intensity: 5,
            duration: 'short',
            location: ['drückend'],
            symptoms: ['Schwindel'],
            triggers: ['Wetterwechsel'],
            medications: ['Paracetamol'],
            effectivnessRating: 'wenig'
          },
          {
            id: '3',
            date: '2024-03-18',
            intensity: 8,
            duration: 'long',
            location: ['pulsierend', 'beidseitig'],
            symptoms: ['Übelkeit', 'Erbrechen', 'Lichtscheu'],
            triggers: ['Schlafmangel'],
            medications: ['Sumatriptan'],
            effectivnessRating: 'ja'
          }
        ]
      };
      
      setMonthDetected(mockData.monthYear);
      setEntriesCount(mockData.entries.length);
      onDataExtracted(mockData);
      setAnalysisComplete(true);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!imageFile) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 animate-fade-up" style={{ animationDelay: '0.2s' }}>
      <div className="glass-morphism rounded-xl p-6">
        <h3 className="text-xl font-medium mb-4 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-headache" />
          Analyse des Kopfschmerz-Kalenders
        </h3>

        {isProcessing ? (
          <div className="text-center py-8">
            <Loader2 className="h-10 w-10 text-headache mx-auto animate-spin mb-4" />
            <h4 className="text-lg font-medium mb-2">Verarbeite Ihren Kalender...</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Wir extrahieren Ihre Kopfschmerzdaten für die Analyse
            </p>
            
            <div className="w-full bg-secondary rounded-full h-2 mb-2">
              <div 
                className="bg-headache h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">{progress}% abgeschlossen</p>
          </div>
        ) : analysisComplete ? (
          <div className="text-center py-6">
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full inline-flex mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h4 className="text-lg font-medium mb-1">Analyse abgeschlossen!</h4>
            <p className="text-muted-foreground mb-6">
              Ihr Kopfschmerz-Kalender für <span className="font-medium">{monthDetected}</span> wurde erfolgreich analysiert.
            </p>
            
            <div className="flex flex-col gap-4 mb-6 text-left">
              <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 rounded-lg">
                <span>Erkannter Monat</span>
                <span className="font-medium">{monthDetected}</span>
              </div>
              
              <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 rounded-lg">
                <span>Gefundene Einträge</span>
                <span className="font-medium">{entriesCount}</span>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <button className="headache-btn bg-headache text-white">
                <BarChart2 className="mr-2 h-4 w-4" />
                Statistiken anzeigen
              </button>
              
              <button className="headache-btn bg-secondary text-foreground">
                <Download className="mr-2 h-4 w-4" />
                Daten exportieren
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AnalysisSection;
