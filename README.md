# Kopfweh – Kopfschmerz- und Migräne-Kalender

Eine schlanke, vollständig lokale Web-App zum Erfassen von Kopfschmerzattacken, zum
Erkennen von Mustern und zum Erstellen eines Arztberichts.

**Privacy first:** Alle Einträge liegen ausschließlich im `localStorage` des Browsers.
Es gibt kein Nutzerkonto, keine Datenbank und keinen Server, der Gesundheitsdaten
speichert. Dadurch kostet der Betrieb praktisch nichts – die App ist eine statische
Single-Page-App plus zwei Edge-Funktionen für den Bezahlvorgang.

## Features

### Kostenlos
- **Kalender** – Monatsansicht, farbcodiert nach Schmerzintensität, Mehrfacheinträge pro Tag
- **Schnell-Erfassung am Handy** – Schritt-für-Schritt-Flow, ein Minimal-Eintrag sind zwei
  Taps; Auswahllisten sortieren sich nach der eigenen Häufigkeit
- **Eintrags-Editor** – Datum, Beginn, Dauer, Intensität (1–10), Kopfschmerzart,
  Schmerzcharakter, Aura, Lokalisation, Begleitsymptome, Auslöser, Medikamente inkl.
  Dosis/Uhrzeit/Wirkung, Beeinträchtigung, Schlaf, Stress, Zyklus, Wetterwechsel, Notizen
- **Übersicht** – Kopfschmerztage, Attacken, Ø Intensität, Ø Dauer, Tage mit
  Akutmedikation, kopfschmerzfreie Serie, Verlaufskurve
- **Analyse (90 Tage)** – automatisch erkannte Muster, Auslöser-Profil, Wochentag- und
  Tageszeit-Verteilung, Begleitsymptome
- **Warnung bei Medikamenten-Übergebrauch** nach den ICHD-3-Grenzwerten
- **Verschlüsseltes Backup** – eine Datei mit allen Einträgen, per Passwort mit
  AES-256-GCM verschlüsselt (PBKDF2, 310 000 Runden). Gedacht für den Gerätewechsel:
  ablegen wo man will, auf dem neuen Handy einspielen. Dazu weiterhin Klartext-JSON
  und die Migration alter Einträge
- **Backup-Erinnerung**, wenn längere Zeit nicht gesichert wurde
- **PWA** – installierbar, funktioniert offline
- Deutsch/Englisch, Hell/Dunkel, Tageserinnerung

### Pro
- Analyse über den **gesamten Zeitraum** statt nur 90 Tage
- **Arztbericht** zum Drucken bzw. als PDF (A4-optimiert), inklusive Krankengeschichte
  und den Spalten des DMKG-Kopfschmerzkalenders
- **CSV-Export** für Excel und Praxissoftware
- **Jahres-Heatmap**
- **Medikamenten-Wirksamkeit** und monatsgenauer Medikamenten-Report
- Eigene Auslöser, Symptome und Medikamente

Neue Nutzer:innen können Pro **14 Tage kostenlos testen** (rein lokal, ohne Konto).
Der **Arztbericht ist vom Test ausgenommen** – er schaltet erst mit dem Kauf frei, weil
er der Grund ist, warum jemand die App kauft. Wer ihn nicht braucht, nutzt die App
dauerhaft kostenlos; ein zurückhaltender **Ko-fi-Spendenlink** liegt in der Kopfzeile,
als kleines Banner auf der Übersicht und in den Einstellungen.

## Tech Stack

Vite · React 18 · TypeScript · Tailwind CSS · shadcn/ui (Radix) · Recharts · date-fns ·
Vercel Edge Functions · Stripe (ohne SDK, direkt über die REST-API)

## Lokale Entwicklung

```bash
npm install
npm run dev        # http://localhost:8080
npm run typecheck  # App + API
npm run lint
npm run build
npm run preview
```

## Live-Vorschau (GitHub Pages)

Zum Testen wird bei jedem Push auf `main` zusätzlich eine kostenlose Vorschau auf GitHub
Pages veröffentlicht: <https://alohaworld42.github.io/headache-harvest/>

Dort läuft die identische App. Nur die Endpunkte unter `/api` existieren dort nicht,
d. h. der Stripe-Kauf ist deaktiviert. Der 14-tägige Pro-Test schaltet alles außer dem
Arztbericht frei; den kann man auf der Vorschau nur mit einem von Hand ausgestellten
Lizenzschlüssel sehen.

Der Basispfad kommt aus der Umgebungsvariable `APP_BASE` (Standard `/`, Pages-Workflow
setzt `/headache-harvest/`), Router, Manifest und Service Worker richten sich danach.

## Deployment auf Vercel

Das Repository ist als Vercel-Projekt direkt deploybar (`vercel.json` liegt bei):

- Framework: **Vite**, Build: `npm run build`, Output: `dist`
- SPA-Rewrite auf `/index.html` (außer `/api/*`), Security-Header und Cache-Header sind
  in `vercel.json` konfiguriert
- Die beiden Funktionen unter `api/` laufen als **Edge Functions** ohne Dependencies

Der Hostingbedarf ist minimal: statische Auslieferung über das CDN plus zwei Funktionen,
die nur beim Kauf bzw. bei der Lizenzprüfung aufgerufen werden.

## Bezahlung aktivieren (Stripe)

Ohne Konfiguration läuft die App vollständig – der Kauf-Button meldet dann lediglich,
dass Checkout noch nicht eingerichtet ist, und der 14-tägige Pro-Test bleibt nutzbar.

Für echte Umsätze in Vercel unter *Settings → Environment Variables* setzen:

| Variable                | Pflicht          | Bedeutung |
| ----------------------- | ---------------- | --------- |
| `STRIPE_SECRET_KEY`     | ja               | Secret Key aus dem Stripe-Dashboard (`sk_live_…`) |
| `STRIPE_PRICE_LIFETIME` | eine von beiden  | Price-ID eines Einmalkaufs (`price_…`) |
| `STRIPE_PRICE_YEARLY`   | eine von beiden  | Price-ID eines Jahres-Abos (`price_…`) |
| `LICENSE_SECRET`        | empfohlen        | Zufälliger String zum Signieren der Lizenzschlüssel; fällt sonst auf den Stripe-Key zurück. **Nicht nachträglich ändern**, sonst werden ausgegebene Schlüssel ungültig. |
| `APP_URL`               | optional         | Basis-URL für die Stripe-Rückleitung, sonst wird der Request-Host verwendet |
| `STRIPE_AUTOMATIC_TAX`  | optional         | `1` aktiviert Stripe Tax |

Für Impressum und Datenschutz zusätzlich (Build-Time, daher `VITE_`-Präfix):
`VITE_LEGAL_NAME`, `VITE_LEGAL_ADDRESS`, `VITE_LEGAL_EMAIL`, `VITE_LEGAL_VAT_ID`.

### Produkt und Preise anlegen

Statt im Dashboard zu klicken:

```bash
STRIPE_SECRET_KEY=sk_test_… npm run setup:stripe
```

Legt „Kopfweh Pro" samt Einmal- und Jahrespreis an und gibt die fertigen
Umgebungsvariablen aus. Wiederholbar — Preise werden über einen Lookup-Key
gefunden, nichts wird doppelt angelegt. Beträge über `--lifetime 24.99` /
`--yearly 9.99`, nur Einmalkauf über `--yearly none`, live über `--live`.

### Deployment prüfen, bevor jemand kauft

```bash
npm run preflight -- https://deine-domain.de
```

Prüft die laufende Instanz: SPA-Rewrite auf der Stripe-Rückleitung, `/api/checkout`
mit aufgelösten Preisen, dass `/api/license` einen gefälschten Token ablehnt, und
dass im ausgelieferten Bundle keine Impressum-Platzhalter mehr stecken. Nur
lesend, legt keine Checkout-Session an. Exit-Code ≠ 0 bei blockierenden Fehlern.

### Lizenzschlüssel von Hand ausstellen

Für Ko-fi-Zahlungen, Überweisungen oder verlorene Schlüssel:

```bash
LICENSE_SECRET=… npm run license -- --email kunde@example.de
LICENSE_SECRET=… npm run license -- --plan yearly --email kunde@example.de
```

Erzeugt exakt denselben HMAC-signierten Token wie der Checkout; einzulösen über
*Einstellungen → Pro → Kauf wiederherstellen*.

### Wie der Kauf funktioniert

1. Klick auf „Pro freischalten" → `POST /api/checkout` erzeugt eine Stripe-Checkout-Session
2. Stripe leitet nach der Zahlung auf `/pro/success?session_id=…`
3. `GET /api/license?session_id=…` prüft bei Stripe, ob bezahlt wurde, und gibt einen
   HMAC-signierten Lizenzschlüssel zurück
4. Der Schlüssel wird lokal gespeichert; `POST /api/license` validiert ihn erneut beim
   Start und über „Kauf wiederherstellen" auf weiteren Geräten

Es wird bewusst **keine Kundendatenbank** betrieben: Stripe ist die einzige Quelle der
Wahrheit für „hat bezahlt", der Lizenzschlüssel ist ein signiertes Token.

## Verkaufsstart

Die vollständige Schritt-für-Schritt-Liste (Vercel, Stripe, Umgebungsvariablen,
Testkauf, Rechtliches, laufender Betrieb) steht in
[`docs/verkaufsstart.md`](docs/verkaufsstart.md).

Kurzfassung — offene Punkte, Fallen, getroffene Entscheidungen:
[`docs/stand-und-naechste-schritte.md`](docs/stand-und-naechste-schritte.md).

**Wichtig, bevor das Repository privat wird:** GitHub Pages liefert private
Repositories nur mit bezahltem GitHub-Plan aus – die Vorschau-URL verschwindet sonst.
Deshalb erst Vercel einrichten, dort prüfen, dann privat schalten.

## Wettbewerb

Eine Analyse des Marktumfelds, der Stiftung-Warentest-Kritikpunkte, des
DMKG-Kalenderstandards und der daraus abgeleiteten Positionierung liegt in
[`docs/wettbewerb.md`](docs/wettbewerb.md).

## Rechtliches

Unter `/legal/imprint`, `/legal/privacy` und `/legal/terms` liegen vorbereitete Seiten
(Impressum, Datenschutzerklärung, AGB mit Widerrufsbelehrung). Sie ziehen die
Betreiberangaben aus den `VITE_LEGAL_*`-Variablen. **Vor dem Verkaufsstart müssen diese
Angaben gesetzt und die Texte rechtlich geprüft werden** – die Vorlagen ersetzen keine
Rechtsberatung.

Die App ist ein Selbstdokumentations-Werkzeug und kein Medizinprodukt: Sie stellt keine
Diagnose und gibt keine Therapieempfehlung.
