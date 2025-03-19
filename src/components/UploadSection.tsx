
import React, { useState, useRef } from 'react';
import { Upload, Image, FileUp, X } from 'lucide-react';
import { toast } from 'sonner';

interface UploadSectionProps {
  onImageUploaded: (file: File) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onImageUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      toast.error('Bitte laden Sie nur Bilder hoch');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreview(e.target.result as string);
        onImageUploaded(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold tracking-tight mb-2">Kopfschmerz-Kalender hochladen</h2>
        <p className="text-muted-foreground">
          Laden Sie ein Bild Ihres Kopfschmerz-Kalenders hoch, um Ihre Daten zu analysieren
        </p>
      </div>

      {!preview ? (
        <div 
          className={`drop-area ${isDragging ? 'active' : ''} flex flex-col items-center justify-center`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileInput}
          />
          
          <div className="p-3 bg-primary/10 rounded-full mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <p className="font-medium mb-1">Ziehen Sie Ihr Bild hierher oder</p>
          <p className="text-sm text-muted-foreground mb-4">
            Unterstützte Formate: JPEG, PNG, GIF
          </p>
          
          <button 
            className="headache-btn bg-primary text-white"
            onClick={triggerFileInput}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Datei auswählen
          </button>
        </div>
      ) : (
        <div className="relative border rounded-lg overflow-hidden animate-fade-in">
          <img 
            src={preview} 
            alt="Vorschau des Kopfschmerz-Kalenders" 
            className="w-full object-contain max-h-[500px]"
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              className="bg-white rounded-full p-2 shadow-lg transform hover:scale-105 transition-transform"
              onClick={clearPreview}
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSection;
