import React, { useState } from 'react';
import { Activity, HelpCircle } from 'lucide-react';
import HelpDialog from './HelpDialog';

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '1.0.0';

const Footer: React.FC = () => {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <footer className="w-full py-4 px-6 glass-morphism animate-fade-in mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-headache" />
            <span className="font-medium">Kopfschmerz-Kalender</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Analysiere und verstehe deine Kopfschmerzmuster
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Hilfe
          </button>
          <span className="text-xs">v{APP_VERSION}</span>
        </div>
      </div>

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </footer>
  );
};

export default Footer;
