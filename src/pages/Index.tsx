
import React, { useState } from 'react';
import Header from '../components/Header';
import UploadSection from '../components/UploadSection';
import AnalysisSection from '../components/AnalysisSection';
import DashboardSection from '../components/DashboardSection';
import Footer from '../components/Footer';
import { ExtractedData } from '../types';

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const handleImageUpload = (file: File) => {
    setUploadedImage(file);
  };

  const handleDataExtracted = (data: ExtractedData) => {
    setExtractedData(data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 sm:px-6 py-8">
        <UploadSection onImageUploaded={handleImageUpload} />
        
        {uploadedImage && (
          <AnalysisSection 
            imageFile={uploadedImage} 
            onDataExtracted={handleDataExtracted} 
          />
        )}
        
        {extractedData && (
          <DashboardSection data={extractedData} />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
