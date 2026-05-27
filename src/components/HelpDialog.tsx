import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '1.0.0';

const HelpDialog: React.FC<HelpDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogTitle>Hilfe & Info</DialogTitle>
        <DialogDescription>So nutzt du den Kopfschmerz-Kalender.</DialogDescription>

        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-medium mb-1">Wofür?</h3>
            <p className="text-muted-foreground">
              Halte deine Kopfschmerzen über Wochen und Monate fest, um Muster zu erkennen — welche Auslöser
              häufig auftreten, welche Medikamente wirken, wie sich Intensität und Dauer entwickeln.
            </p>
          </section>

          <section>
            <h3 className="font-medium mb-1">Einträge anlegen</h3>
            <p className="text-muted-foreground">
              Klicke im Kalender auf einen Tag ohne Eintrag oder auf „Neuer Eintrag". Du wirst Schritt für
              Schritt durch Intensität, Dauer, Lokalisation, Symptome, Auslöser und Medikamente geführt.
            </p>
          </section>

          <section>
            <h3 className="font-medium mb-1">Einträge bearbeiten/löschen</h3>
            <p className="text-muted-foreground">
              Klicke auf einen Tag mit Eintrag. Im Detail-Dialog kannst du bearbeiten oder löschen. Mehrere
              Einträge pro Tag werden als Liste angezeigt.
            </p>
          </section>

          <section>
            <h3 className="font-medium mb-1">Farben im Kalender</h3>
            <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
              <li>Grün: leichte Kopfschmerzen (Intensität 1–3)</li>
              <li>Bernstein: mittlere Kopfschmerzen (4–6)</li>
              <li>Rot: starke Kopfschmerzen (7–10)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-medium mb-1">Statistik</h3>
            <p className="text-muted-foreground">
              Im Tab „Statistiken" kannst du den Zeitraum wählen. Die Auswertung zeigt Intensitätsverlauf,
              häufigste Auslöser/Symptome, Wochentag-Muster und die Wirksamkeit deiner Medikamente.
            </p>
          </section>

          <section className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-3">
            <h3 className="font-medium mb-1">Wichtig: Datenspeicherung</h3>
            <p className="text-muted-foreground">
              Alle Daten werden ausschließlich lokal in deinem Browser gespeichert (LocalStorage). Wenn du
              den Browserspeicher leerst, sind die Einträge weg. Nutze regelmäßig den{' '}
              <strong>JSON-Export</strong> oben rechts als Backup.
            </p>
          </section>

          <p className="text-xs text-muted-foreground pt-2 border-t">
            Kopfschmerz-Kalender · Version {APP_VERSION}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
