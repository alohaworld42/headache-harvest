# Verkaufsstart – Checkliste

Alles, was die App selbst braucht, ist gebaut. Offen ist nur, was ohne deine
Zugangsdaten nicht geht. Reihenfolge einhalten, dann ist der Kauf in etwa einer
Stunde live.

## 0. Vorher: Repo privat schalten

**Achtung, ein Fallstrick:** GitHub Pages funktioniert bei privaten Repositories
nur mit einem bezahlten GitHub-Plan. Auf dem Free-Plan verschwindet die Vorschau
unter `alohaworld42.github.io/headache-harvest/`, sobald das Repo privat wird.

Deshalb: **erst Vercel einrichten (Schritt 1), Live-Betrieb dort prüfen, dann das
Repo privat schalten.** Vercel deployt private Repositories auch im Hobby-Plan.
Danach kann die Pages-Workflow-Datei `.github/workflows/pages.yml` weg.

## 1. Vercel-Projekt anlegen

1. [vercel.com/new](https://vercel.com/new) öffnen, das Repository importieren.
2. Framework wird als **Vite** erkannt, Build `npm run build`, Output `dist` —
   `vercel.json` bringt Rewrites, Security-Header und Cache-Regeln bereits mit.
3. Deployen und die `*.vercel.app`-URL kurz durchklicken.

Erst hier existieren die Endpunkte unter `/api`, die den Kauf abwickeln.

## 2. Stripe einrichten

1. Bei [stripe.com](https://dashboard.stripe.com) registrieren, Geschäftsdaten und
   Bankverbindung hinterlegen (Auszahlung geht sonst nicht raus).
2. Unter *Entwickler → API-Schlüssel* den **Secret Key** kopieren. Fang mit dem
   Testmodus an (`sk_test_…`).
3. Produkt und Preise anlegen lassen:

   ```bash
   STRIPE_SECRET_KEY=sk_test_… npm run setup:stripe
   ```

   Legt „Kopfweh Pro" an, einen **einmaligen** Preis zu 17,99 € (Migraine Buddy
   verlangt 89,99 $ **pro Jahr** — der Einmalkauf ist dein stärkstes Argument)
   und einen **jährlichen** zu 7,99 €. Andere Beträge über `--lifetime 24.99`
   bzw. `--yearly 9.99`, nur den Einmalkauf über `--yearly none`. Am Ende stehen
   genau die Variablen da, die unten in Vercel gehören.

   Das Skript ist gefahrlos wiederholbar: Preise werden über einen Lookup-Key
   gefunden, ein zweiter Lauf legt nichts doppelt an. Preise sind bei Stripe
   unveränderlich — für einen anderen Betrag den alten im Dashboard archivieren
   und neu laufen lassen.

4. Wenn der Testkauf (Schritt 4 unten) sitzt, dasselbe live:

   ```bash
   LICENSE_SECRET=… STRIPE_SECRET_KEY=sk_live_… npm run setup:stripe --live
   ```

   Test- und Live-Modus sind bei Stripe getrennte Welten, die Price-IDs aus dem
   einen gelten im anderen nicht. Ein Live-Key ohne `--live` wird abgelehnt.
   `LICENSE_SECRET` mitgeben, sobald du eins hast — sonst schlägt dir das Skript
   ein neues vor, und das würde alle bereits ausgegebenen Schlüssel entwerten.

## 3. Umgebungsvariablen in Vercel

*Settings → Environment Variables*, für **Production** und **Preview**:

| Variable | Wert |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_live_…` |
| `STRIPE_PRICE_LIFETIME` | Price-ID des Einmalkaufs |
| `STRIPE_PRICE_YEARLY` | Price-ID des Abos (optional) |
| `LICENSE_SECRET` | kommt aus `npm run setup:stripe` (sonst: `openssl rand -base64 32`) |
| `APP_URL` | `https://deine-domain.de` |
| `STRIPE_AUTOMATIC_TAX` | `1`, sobald Stripe Tax eingerichtet ist |
| `VITE_LEGAL_NAME` | dein Name bzw. Firmierung |
| `VITE_LEGAL_ADDRESS` | ladungsfähige Anschrift |
| `VITE_LEGAL_EMAIL` | Kontakt-Adresse |
| `VITE_LEGAL_VAT_ID` | USt-IdNr., falls vorhanden |
| `VITE_KOFI_HANDLE` | optional, Standard `sunspotter` |

`LICENSE_SECRET` **niemals nachträglich ändern** — alle ausgegebenen Schlüssel
würden ungültig. Nach dem Setzen einmal neu deployen.

## 4. Kauf einmal echt durchspielen

Mit Stripes Testmodus (`sk_test_…` und Testpreise) und der Kartennummer
`4242 4242 4242 4242`:

1. „Pro freischalten" → Checkout → bezahlen
2. Rückleitung auf `/pro/success` zeigt den Lizenzschlüssel
3. Arztbericht ist freigeschaltet
4. Schlüssel kopieren, in einem anderen Browser unter *Einstellungen → Pro →
   Kauf wiederherstellen* einfügen → muss ebenfalls freischalten

Danach auf die Live-Keys umstellen.

## 5. Rechtliches — bevor der erste Euro fließt

- Impressum, Datenschutz und AGB ziehen die `VITE_LEGAL_*`-Werte. **Die Texte
  sind Vorlagen und gehören rechtlich geprüft**, besonders die
  Widerrufsbelehrung und alles rund um Gesundheitsdaten nach Art. 9 DSGVO.
- Kleinunternehmerregelung (§ 19 UStG) oder Umsatzsteuer? Danach richtet sich, ob
  du `STRIPE_AUTOMATIC_TAX` brauchst.
- Verkauf an Verbraucher in der EU heißt: MwSt. am Wohnort der Kundschaft.
  Stripe Tax nimmt dir das ab, kostet aber Prozente. Alternative wäre ein
  Merchant-of-Record wie Paddle oder Lemon Squeezy, der die Steuer komplett
  übernimmt — dafür müsste die Checkout-Funktion umgebaut werden.

## Laufender Betrieb

**Jemand hat per Ko-fi oder Überweisung bezahlt** — oder hat seinen Schlüssel
verloren:

```bash
LICENSE_SECRET=… npm run license -- --email kunde@example.de
LICENSE_SECRET=… npm run license -- --plan yearly --email kunde@example.de
```

Der Schlüssel ist derselbe HMAC-signierte Token wie aus dem Checkout und wird
über „Kauf wiederherstellen" eingelöst.

**Widerruf innerhalb von 14 Tagen:** in Stripe erstatten. Der bereits
ausgegebene Schlüssel läuft weiter — bei einem Einmalkauf ist das der Preis für
den fehlenden Server. Wird das zum Problem, wäre eine Sperrliste in der
Verify-Funktion der nächste Schritt.

**Kosten:** Vercel Hobby reicht (statische Auslieferung plus zwei Edge-Funktionen,
die nur beim Kauf laufen). Stripe nimmt 1,5 % + 0,25 € je europäischer
Kartenzahlung. Bei 17,99 € bleiben dir rund 17,50 €.

## Was die Nutzer bekommen

| | Kostenlos | 14-Tage-Test | Gekauft |
| --- | :-: | :-: | :-: |
| Erfassen, Kalender, 90-Tage-Analyse | ✅ | ✅ | ✅ |
| Verschlüsseltes Backup | ✅ | ✅ | ✅ |
| Warnung vor Medikamenten-Übergebrauch | ✅ | ✅ | ✅ |
| Analyse über den gesamten Zeitraum | – | ✅ | ✅ |
| CSV-Export, Jahres-Heatmap, eigene Listen | – | ✅ | ✅ |
| **Arztbericht** | – | **–** | ✅ |

Der Arztbericht ist bewusst vom Test ausgenommen: Er ist der Grund, warum jemand
kauft. Wer ihn nicht braucht, kann die App dauerhaft kostenlos nutzen — und
findet in den Einstellungen den Ko-fi-Button.
