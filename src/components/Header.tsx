import React, { useRef, useState } from 'react';
import { Calendar, Download, HelpCircle, Upload, FileJson, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import ThemeToggle from './ThemeToggle';
import HelpDialog from './HelpDialog';
import { HeadacheEntry } from '../types';
import { exportCSV, exportJSON, importJSON, mergeEntries } from '@/lib/dataIO';

interface HeaderProps {
  entries: HeadacheEntry[];
  onReplaceEntries: (entries: HeadacheEntry[]) => void;
}

const Header: React.FC<HeaderProps> = ({ entries, onReplaceEntries }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<HeadacheEntry[] | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const imported = await importJSON(file);
      setPendingImport(imported);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import fehlgeschlagen.');
    }
  };

  const handleReplace = () => {
    if (!pendingImport) return;
    onReplaceEntries(pendingImport);
    toast.success(`${pendingImport.length} Einträge importiert (ersetzt).`);
    setPendingImport(null);
  };

  const handleAppend = () => {
    if (!pendingImport) return;
    const merged = mergeEntries(entries, pendingImport);
    const added = merged.length - entries.length;
    onReplaceEntries(merged);
    toast.success(`${added} neue Einträge hinzugefügt (${pendingImport.length - added} Duplikate übersprungen).`);
    setPendingImport(null);
  };

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

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Daten exportieren oder importieren">
              <Download className="h-4 w-4 text-headache" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportJSON(entries)} disabled={entries.length === 0}>
              <FileJson className="h-4 w-4 mr-2" />
              Als JSON exportieren
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCSV(entries)} disabled={entries.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              Als CSV exportieren
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleImportClick}>
              <Upload className="h-4 w-4 mr-2" />
              JSON importieren
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Hilfe anzeigen"
          onClick={() => setHelpOpen(true)}
        >
          <HelpCircle className="h-4 w-4 text-headache" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileSelected}
      />

      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      <AlertDialog open={pendingImport !== null} onOpenChange={(open) => !open && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import: {pendingImport?.length ?? 0} Einträge gefunden</AlertDialogTitle>
            <AlertDialogDescription>
              Sollen die vorhandenen Einträge ersetzt werden, oder sollen die importierten Einträge an die
              bestehenden angehängt werden? Beim Anhängen werden Duplikate (gleiche ID) übersprungen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <Button variant="outline" onClick={handleAppend}>
              Anhängen
            </Button>
            <AlertDialogAction onClick={handleReplace}>Ersetzen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};

export default Header;
