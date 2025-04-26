
import React from 'react';
import { Calendar, BarChart2, Info } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 w-full py-4 px-6 flex justify-between items-center bg-background/80 backdrop-blur-lg border-b z-50">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-headache to-headache-dark rounded-xl p-2.5 shadow-lg">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-headache to-headache-dark bg-clip-text text-transparent">
            Kopfschmerz-Kalender
          </h1>
          <p className="text-sm text-muted-foreground">Tracking & Analyse</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent/10 transition-colors">
          <BarChart2 className="h-4 w-4 text-headache" />
          <span className="text-sm font-medium">Statistiken</span>
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent/10 transition-colors">
          <Info className="h-4 w-4 text-headache" />
          <span className="text-sm font-medium">Info</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
