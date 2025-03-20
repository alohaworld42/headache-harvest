
import React from 'react';
import { FileText, BarChart2, Info, Calendar } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center glass-morphism animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-headache rounded-full p-2 shadow-md">
          <Calendar className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Kopfschmerz-Kalender</h1>
          <p className="text-sm text-muted-foreground">Tracking & Analyse</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent/10 transition-colors">
          <BarChart2 className="h-4 w-4" />
          <span className="text-sm font-medium">Statistiken</span>
        </button>
        
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent/10 transition-colors">
          <Info className="h-4 w-4" />
          <span className="text-sm font-medium">Info</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
