import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/store/app-store';

export type LegalKind = 'privacy' | 'terms' | 'imprint';

const operator = {
  name: import.meta.env.VITE_LEGAL_NAME ?? '[Betreiber:in eintragen]',
  address: import.meta.env.VITE_LEGAL_ADDRESS ?? '[Anschrift eintragen]',
  email: import.meta.env.VITE_LEGAL_EMAIL ?? '[E-Mail eintragen]',
  vatId: import.meta.env.VITE_LEGAL_VAT_ID ?? '',
};

/**
 * A German imprint with placeholder operator details is not merely incomplete,
 * it is a legal risk — and the placeholders are quiet enough to ship unnoticed.
 * Better to say so on the page than to find out by post.
 */
const operatorMissing = !(
  import.meta.env.VITE_LEGAL_NAME &&
  import.meta.env.VITE_LEGAL_ADDRESS &&
  import.meta.env.VITE_LEGAL_EMAIL
);

interface Block {
  heading: string;
  paragraphs: string[];
}

const CONTENT: Record<LegalKind, Record<'de' | 'en', { title: string; blocks: Block[] }>> = {
  privacy: {
    de: {
      title: 'Datenschutzerklärung',
      blocks: [
        {
          heading: 'Kurzfassung',
          paragraphs: [
            'Deine Schmerz-Einträge werden ausschließlich lokal im Speicher deines Browsers (localStorage) abgelegt. Sie werden nicht an einen Server übertragen, nicht ausgewertet und nicht weitergegeben. Es gibt kein Nutzerkonto.',
          ],
        },
        {
          heading: 'Verantwortliche Stelle',
          paragraphs: [`${operator.name}, ${operator.address}, ${operator.email}`],
        },
        {
          heading: 'Gesundheitsdaten',
          paragraphs: [
            'Angaben zu Schmerzen, Medikamenten und Symptomen sind Gesundheitsdaten im Sinne von Art. 9 DSGVO. Da sie das Endgerät nicht verlassen, findet keine Verarbeitung durch uns statt. Beim Löschen der Browserdaten oder beim Wechsel des Geräts gehen die Einträge verloren – nutze dafür die Backup-Funktion.',
          ],
        },
        {
          heading: 'Hosting und Server-Logs',
          paragraphs: [
            'Die Anwendung wird über Vercel Inc. ausgeliefert. Beim Abruf der Seite verarbeitet der Hoster technisch notwendige Verbindungsdaten (IP-Adresse, Zeitpunkt, angeforderte Ressource, User-Agent) auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO zur sicheren Bereitstellung des Dienstes.',
          ],
        },
        {
          heading: 'Zahlungsabwicklung',
          paragraphs: [
            'Für den Kauf von Pro nutzen wir Stripe. Beim Bezahlvorgang verarbeitet Stripe die von dir eingegebenen Zahlungs- und Rechnungsdaten eigenverantwortlich; Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Wir erhalten von Stripe lediglich die Information, dass eine Zahlung erfolgreich war, sowie die zugehörige E-Mail-Adresse zur Ausstellung des Lizenzschlüssels. Es wird keine Datenbank mit Kundendaten betrieben – der Lizenzschlüssel wird signiert erzeugt und nur lokal bei dir gespeichert.',
          ],
        },
        {
          heading: 'Cookies und Tracking',
          paragraphs: [
            'Die App setzt keine Marketing- oder Analyse-Cookies und bindet keine Tracker ein. Der lokale Speicher wird ausschließlich für deine Einträge und Einstellungen genutzt.',
          ],
        },
        {
          heading: 'Deine Rechte',
          paragraphs: [
            'Dir stehen die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch zu, ebenso das Recht auf Beschwerde bei einer Aufsichtsbehörde. Da wir keine personenbezogenen Einträge speichern, kannst du Löschung und Export jederzeit selbst in den Einstellungen ausführen.',
          ],
        },
      ],
    },
    en: {
      title: 'Privacy policy',
      blocks: [
        {
          heading: 'In short',
          paragraphs: [
            'Your pain entries are stored exclusively in your browser’s local storage. They are never uploaded, analysed or shared. There is no user account.',
          ],
        },
        {
          heading: 'Controller',
          paragraphs: [`${operator.name}, ${operator.address}, ${operator.email}`],
        },
        {
          heading: 'Health data',
          paragraphs: [
            'Information about pain, medication and symptoms is health data under Art. 9 GDPR. Because it never leaves your device, we do not process it. Clearing browser data or switching devices will remove your entries – use the backup function for that.',
          ],
        },
        {
          heading: 'Hosting and server logs',
          paragraphs: [
            'The app is delivered via Vercel Inc. When you load the page, the host processes technically necessary connection data (IP address, timestamp, requested resource, user agent) under Art. 6(1)(f) GDPR to provide the service securely.',
          ],
        },
        {
          heading: 'Payments',
          paragraphs: [
            'Pro purchases are handled by Stripe. Stripe processes the payment and billing data you enter as an independent controller; the legal basis is Art. 6(1)(b) GDPR. We only receive confirmation that a payment succeeded plus the associated e-mail address in order to issue a licence key. No customer database is operated – the licence key is generated as a signed token and stored only on your device.',
          ],
        },
        {
          heading: 'Cookies and tracking',
          paragraphs: [
            'The app sets no marketing or analytics cookies and embeds no trackers. Local storage is used solely for your entries and settings.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'You have the right to access, rectification, erasure, restriction, data portability and objection, as well as the right to lodge a complaint with a supervisory authority. Since we store no personal entries, you can export or delete everything yourself in the settings.',
          ],
        },
      ],
    },
  },
  terms: {
    de: {
      title: 'Allgemeine Geschäftsbedingungen',
      blocks: [
        {
          heading: '1. Leistungsumfang',
          paragraphs: [
            'Die App stellt ein digitales Schmerz-Tagebuch bereit. Die Basisfunktionen sind kostenlos. Mit „Pro" werden zusätzliche Auswertungen, der Arztbericht und Exportfunktionen freigeschaltet.',
          ],
        },
        {
          heading: '2. Vertragsschluss und Preise',
          paragraphs: [
            'Der Vertrag kommt mit Abschluss des Bezahlvorgangs über Stripe zustande. Es gelten die im Bezahlvorgang angezeigten Preise inklusive gesetzlicher Umsatzsteuer. Pro wird als Einmalkauf (dauerhafte Nutzung) oder als Jahreslizenz angeboten.',
          ],
        },
        {
          heading: '3. Lizenz',
          paragraphs: [
            'Nach Zahlung erhältst du einen Lizenzschlüssel zur Nutzung auf deinen eigenen Geräten. Eine Weitergabe an Dritte ist nicht gestattet.',
          ],
        },
        {
          heading: '4. Widerrufsrecht für Verbraucher',
          paragraphs: [
            'Verbraucher:innen haben das Recht, den Vertrag binnen 14 Tagen ohne Angabe von Gründen zu widerrufen. Der Widerruf ist formlos an die im Impressum genannte Adresse zu richten. Das Widerrufsrecht erlischt vorzeitig, wenn du ausdrücklich zustimmst, dass mit der Ausführung vor Ablauf der Widerrufsfrist begonnen wird, und du deine Kenntnis vom Erlöschen bestätigst.',
          ],
        },
        {
          heading: '5. Keine medizinische Beratung',
          paragraphs: [
            'Die App dient der Selbstdokumentation. Sie stellt keine Diagnose, gibt keine Therapieempfehlung und ersetzt keine ärztliche Behandlung. Hinweise wie die Warnung vor Medikamenten-Übergebrauch sind allgemeine Informationen und kein medizinischer Rat.',
          ],
        },
        {
          heading: '6. Verfügbarkeit und Haftung',
          paragraphs: [
            'Die App wird mit Sorgfalt bereitgestellt, eine ununterbrochene Verfügbarkeit wird nicht geschuldet. Die Haftung ist auf Vorsatz und grobe Fahrlässigkeit beschränkt; bei Verletzung wesentlicher Vertragspflichten haften wir auch bei einfacher Fahrlässigkeit, begrenzt auf den vertragstypischen, vorhersehbaren Schaden. Für den Verlust lokal gespeicherter Daten wird nicht gehaftet – erstelle regelmäßig Backups.',
          ],
        },
        {
          heading: '7. Schlussbestimmungen',
          paragraphs: [
            'Es gilt deutsches Recht. Ist eine Bestimmung unwirksam, bleibt der übrige Vertrag wirksam. Die EU-Plattform zur Online-Streitbeilegung findest du unter https://ec.europa.eu/consumers/odr. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
          ],
        },
      ],
    },
    en: {
      title: 'Terms and conditions',
      blocks: [
        {
          heading: '1. Scope of service',
          paragraphs: [
            'The app provides a digital pain diary. Core features are free. "Pro" unlocks additional analyses, the doctor report and export functions.',
          ],
        },
        {
          heading: '2. Contract and prices',
          paragraphs: [
            'The contract is concluded when the payment via Stripe is completed. The prices shown during checkout apply, including statutory VAT. Pro is offered as a one-time purchase (permanent use) or as an annual licence.',
          ],
        },
        {
          heading: '3. Licence',
          paragraphs: [
            'After payment you receive a licence key for use on your own devices. Passing it on to third parties is not permitted.',
          ],
        },
        {
          heading: '4. Right of withdrawal',
          paragraphs: [
            'Consumers may withdraw from the contract within 14 days without giving reasons. The withdrawal can be sent informally to the address in the imprint. The right expires early if you expressly consent to the immediate performance and confirm your knowledge of that consequence.',
          ],
        },
        {
          heading: '5. No medical advice',
          paragraphs: [
            'The app is a self-documentation tool. It does not provide a diagnosis or therapy recommendation and does not replace medical treatment. Hints such as the medication-overuse warning are general information, not medical advice.',
          ],
        },
        {
          heading: '6. Availability and liability',
          paragraphs: [
            'The app is provided with care, but uninterrupted availability is not owed. Liability is limited to intent and gross negligence; for breaches of essential contractual duties we are also liable for simple negligence, limited to foreseeable damage typical for this type of contract. We are not liable for the loss of locally stored data – please create backups regularly.',
          ],
        },
        {
          heading: '7. Final provisions',
          paragraphs: [
            'German law applies. If a provision is invalid, the remainder of the contract stays effective. The EU online dispute resolution platform is available at https://ec.europa.eu/consumers/odr. We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board.',
          ],
        },
      ],
    },
  },
  imprint: {
    de: {
      title: 'Impressum',
      blocks: [
        {
          heading: 'Angaben gemäß § 5 DDG',
          paragraphs: [operator.name, operator.address, `E-Mail: ${operator.email}`],
        },
        {
          heading: 'Verantwortlich für den Inhalt',
          paragraphs: [`${operator.name}, Anschrift wie oben`],
        },
        ...(operator.vatId
          ? [{ heading: 'Umsatzsteuer-Identifikationsnummer', paragraphs: [operator.vatId] }]
          : []),
        {
          heading: 'Haftung für Inhalte',
          paragraphs: [
            'Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.',
          ],
        },
      ],
    },
    en: {
      title: 'Imprint',
      blocks: [
        {
          heading: 'Information according to § 5 DDG',
          paragraphs: [operator.name, operator.address, `E-mail: ${operator.email}`],
        },
        {
          heading: 'Responsible for content',
          paragraphs: [`${operator.name}, address as above`],
        },
        ...(operator.vatId ? [{ heading: 'VAT identification number', paragraphs: [operator.vatId] }] : []),
        {
          heading: 'Liability for content',
          paragraphs: [
            'As a service provider we are responsible for our own content on these pages under general law. We are, however, not obliged to monitor transmitted or stored third-party information.',
          ],
        },
      ],
    },
  },
};

export default function Legal({ kind }: { kind: LegalKind }) {
  const { t, lang } = useApp();
  const content = CONTENT[kind][lang];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('legal.backHome')}
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>

      {operatorMissing && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p className="font-medium">{t('legal.draftTitle')}</p>
          <p className="mt-1 text-muted-foreground">{t('legal.draftBody')}</p>
        </div>
      )}

      <div className="space-y-6">
        {content.blocks.map((block) => (
          <section key={block.heading} className="space-y-2">
            <h2 className="text-sm font-semibold">{block.heading}</h2>
            {block.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
