import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, ListChecks, AlertTriangle } from 'lucide-react';
import { useApp } from '@/store/app-store';

/**
 * A page for the people who hand the app out, not the people who use it.
 *
 * What convinces a physician is not the feature list a patient reads — it is
 * whether the printout matches the calendar they already know, whether the
 * medication days are counted the way the guideline counts them, and where the
 * health data ends up. Those three answers live here, in their vocabulary.
 */

interface Block {
  icon: React.ComponentType<{ className?: string }>;
  heading: string;
  body: string;
  bullets?: string[];
}

const CONTENT: Record<'de' | 'en', { title: string; intro: string; blocks: Block[]; columns: string[]; columnsNote: string; handout: string; handoutBody: string; disclaimer: string }> = {
  de: {
    title: 'Für Behandelnde',
    intro:
      'Ein Selbstdokumentations-Werkzeug für Patient:innen mit Kopfschmerz oder Migräne. Kein Medizinprodukt: es stellt keine Diagnose und gibt keine Therapieempfehlung.',
    blocks: [
      {
        icon: FileText,
        heading: 'Der Ausdruck folgt dem DMKG-Kopfschmerzkalender',
        body: 'Patient:innen bringen einen A4-optimierten Bericht mit — Zusammenfassung, Krankengeschichte und eine Tagebuchtabelle mit den Spalten, die Sie aus dem Kalender der Deutschen Migräne- und Kopfschmerzgesellschaft kennen. Druckbar oder als PDF.',
      },
      {
        icon: ListChecks,
        heading: 'Medikamententage nach ICHD-3 gezählt',
        body: 'Die App warnt bei Übergebrauch anhand der Grenzwerte der ICHD-3: ab 10 Einnahmetagen im Monat bei Triptanen, Kombinationspräparaten, Ergotaminen und Opioiden, ab 15 Tagen bei einfachen Analgetika. Die Zählung steht monatsweise im Bericht.',
      },
      {
        icon: Lock,
        heading: 'Die Daten verlassen das Gerät nicht',
        body: 'Es gibt kein Nutzerkonto, keine Datenbank und keinen Server, der Gesundheitsdaten speichert. Alle Einträge liegen im lokalen Speicher des Browsers. Sie können die App empfehlen, ohne eine Datenweitergabe nach Art. 9 DSGVO zu veranlassen — und ohne dass ein Anbieter Bewegungsprofile Ihrer Patient:innen sammelt.',
      },
    ],
    columns: [
      'Datum und Beginn',
      'Dauer',
      'Intensität (numerische Ratingskala 1–10)',
      'Kopfschmerzart und Aura',
      'Schmerzcharakter und Lokalisation',
      'Begleitsymptome',
      'Auslöser',
      'Medikation mit Präparat, Dosis, Uhrzeit und Wirkung',
      'Beeinträchtigung im Alltag',
    ],
    columnsNote:
      'Zusätzlich erfassbar: Schlafdauer, Stresslevel, Zyklus und Wetterwechsel. Die Krankengeschichte — Beschwerden seit, Vorerkrankungen, Prophylaxe, Beruf, Familienanamnese — steht im Kopf des Berichts.',
    handout: 'Weiterempfehlen',
    handoutBody:
      'Die App läuft im Browser, ohne Installation und ohne Registrierung. Ein Hinweis auf die Adresse genügt; ein Minimal-Eintrag sind auf dem Handy zwei Taps. Der Grundumfang inklusive Kalender, Auswertung und Übergebrauchs-Warnung ist dauerhaft kostenlos, der Arztbericht ist kostenpflichtig.',
    disclaimer:
      'Die Auswertungen sind deskriptiv und ersetzen weder Anamnese noch Diagnostik. Bei Warnsymptomen ersetzt kein Tagebuch die zeitnahe Abklärung.',
  },
  en: {
    title: 'For clinicians',
    intro:
      'A self-documentation tool for people with headache or migraine. Not a medical device: it makes no diagnosis and gives no treatment advice.',
    blocks: [
      {
        icon: FileText,
        heading: 'The printout follows the DMKG headache calendar',
        body: 'Patients bring an A4-optimised report — summary, history and a diary table using the columns of the German Migraine and Headache Society calendar. Printable or as a PDF.',
      },
      {
        icon: ListChecks,
        heading: 'Medication days counted per ICHD-3',
        body: 'The app warns about overuse against the ICHD-3 thresholds: from 10 intake days per month for triptans, combination analgesics, ergotamines and opioids, from 15 days for simple analgesics. The count appears per month in the report.',
      },
      {
        icon: Lock,
        heading: 'Data never leaves the device',
        body: 'There is no account, no database and no server storing health data. Every entry lives in the browser’s local storage. You can recommend it without triggering a transfer of Article 9 GDPR data — and without a vendor building profiles of your patients.',
      },
    ],
    columns: [
      'Date and onset',
      'Duration',
      'Intensity (numeric rating scale 1–10)',
      'Headache type and aura',
      'Pain quality and location',
      'Associated symptoms',
      'Triggers',
      'Medication with drug, dose, time and effect',
      'Impact on daily life',
    ],
    columnsNote:
      'Also recordable: sleep duration, stress level, menstrual cycle and weather change. The history — onset, comorbidities, prophylaxis, occupation, family history — appears in the report header.',
    handout: 'Recommending it',
    handoutBody:
      'The app runs in the browser, with no installation and no sign-up. Pointing at the address is enough; a minimal entry is two taps on a phone. The core — calendar, analysis and the overuse warning — is free indefinitely; the doctor report is paid.',
    disclaimer:
      'The analyses are descriptive and replace neither history taking nor diagnostics. Where red flags are present, no diary substitutes for timely investigation.',
  },
};

export default function Clinicians() {
  const { t, lang } = useApp();
  const content = CONTENT[lang];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('legal.backHome')}
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{content.intro}</p>
      </header>

      <div className="space-y-4">
        {content.blocks.map((block) => {
          const Icon = block.icon;
          return (
            <section key={block.heading} className="surface flex gap-3 p-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <div className="min-w-0 space-y-1">
                <h2 className="text-sm font-semibold">{block.heading}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{block.body}</p>
              </div>
            </section>
          );
        })}
      </div>

      <section className="surface space-y-3 p-4">
        <h2 className="text-sm font-semibold">{t('report.diary')}</h2>
        <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {content.columns.map((column) => (
            <li key={column} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
              {column}
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">{content.columnsNote}</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{content.handout}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{content.handoutBody}</p>
      </section>

      <div className="flex gap-3 rounded-xl border bg-muted/30 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm leading-relaxed text-muted-foreground">{content.disclaimer}</p>
      </div>
    </div>
  );
}
