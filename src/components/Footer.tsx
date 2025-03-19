
import React from 'react';
import { FileText, Activity, Calendar, Info } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 px-6 glass-morphism animate-fade-in mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-headache" />
            <span className="font-medium">Kopfschmerz-Kalender</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Analysiere und verstehe deine Kopfschmerzmuster
          </p>
        </div>
        
        <div className="flex gap-6">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Datenschutz
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Impressum
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Hilfe
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
