# Stand und nächste Schritte

Übergabe-Notiz. Was fertig ist, was als Nächstes ansteht und warum die Sachen so
gebaut sind, wie sie gebaut sind. Ergänzt [`verkaufsstart.md`](verkaufsstart.md),
die die eigentliche Klickstrecke enthält.

Stand: `main` bei „Add a script that sets up the Stripe product and prices" (#8).

## Was läuft

- **App fertig und deployed** auf <https://alohaworld42.github.io/headache-harvest/>.
  Kalender, Eintrags-Editor, Schnell-Erfassung fürs Handy, Übersicht, Analyse,
  Arztbericht, Medikamenten-Übergebrauchs-Warnung nach ICHD-3, PWA, DE/EN,
  Hell/Dunkel.
- **Alle Gesundheitsdaten bleiben lokal** im `localStorage` (`headtrack.v2`).
  Kein Konto, keine Datenbank, kein Server, der Gesundheitsdaten sieht.
- **Verschlüsseltes Backup** (AES-256-GCM, PBKDF2 mit 310 000 Runden) für den
  Gerätewechsel, plus Klartext-JSON und CSV.
- **Bezahlvorgang gebaut, aber nicht scharfgeschaltet**: zwei Edge Functions unter
  `api/`, Stripe direkt über die REST-API, Lizenz als HMAC-signiertes Token.
  Ohne Konfiguration meldet der Kauf-Button lediglich, dass Checkout noch nicht
  eingerichtet ist — die App selbst läuft vollständig.
- **Ko-fi** in Kopfzeile, als kleines Banner auf der Übersicht und in den
  Einstellungen. Handle `sunspotter`, überschreibbar via `VITE_KOFI_HANDLE`.

## Was noch offen ist

Alles Weitere braucht Zugangsdaten und ist damit nicht von einer Session aus
erledigbar. Reihenfolge ist wichtig:

1. **Vercel-Projekt anlegen.** Dashboard → *Add New → Project* → dieses Repository
   importieren. Framework wird als Vite erkannt, `vercel.json` bringt Rewrites,
   Security- und Cache-Header mit.

   Der Vercel-MCP hilft hier nicht: Sein einziger Deploy-Befehl erwartet den
   kompletten Dateibaum inline und erzeugt ein Projekt **ohne** Git-Anbindung,
   bei dem jede Änderung komplett neu hochgeladen werden müsste. Der Import über
   das Dashboard ist der richtige Weg und deployt danach jeden Push automatisch.

2. **Stripe im Testmodus einrichten:**

   ```bash
   STRIPE_SECRET_KEY=sk_test_… npm run setup:stripe
   ```

   Legt Produkt und Preise an und gibt die Umgebungsvariablen aus. Wiederholbar.

3. **Variablen in Vercel setzen** (Production *und* Preview), Liste in
   `verkaufsstart.md`. Danach einmal neu deployen.

4. **Testkauf** mit `4242 4242 4242 4242`, dann dasselbe Skript mit `--live` und
   dem Live-Key. `LICENSE_SECRET` dabei mitgeben.

5. **Rechtstexte prüfen lassen.** Unter `/legal/*` liegen Vorlagen, die die
   Betreiberangaben aus den `VITE_LEGAL_*`-Variablen ziehen. Die Vorlagen
   ersetzen keine Rechtsberatung, und ohne korrektes Impressum verkauft man in
   Deutschland besser nicht.

6. **Erst danach das Repository privat schalten.** GitHub Pages liefert private
   Repositories nur mit bezahltem Plan aus — die Vorschau-URL verschwindet
   sonst, bevor der Vercel-Ersatz steht.

## Entscheidungen, die man kennen sollte

**Der Arztbericht ist kauf-only, nicht im 14-Tage-Test.** `ProStatus` hat deshalb
zwei Felder: `active` (Kauf *oder* Test) und `paid` (nur Kauf). `ProGate` mit
`require="paid"` hängt daran. Wichtig: Das Gate rendert einen Platzhalter statt
den Inhalt zu verstecken — eine Blur-Klasse wäre über die Devtools in einer
Sekunde entfernt gewesen.

**Kein WASM-SQLite.** War angedacht für den Datenexport, ist aber rund 1 MB für
Abfrage-Fähigkeiten, die die App nicht braucht — die Auswertung läuft im
Speicher über ein kleines Array. Stattdessen ein verschlüsselter JSON-Umschlag.
Falls das ~5-MB-Kontingent des `localStorage` irgendwann eng wird, ist IndexedDB
der nächste Schritt, nicht SQLite.

**Das Backup enthält bewusst nicht den Lizenzschlüssel.** Sonst würde eine
weitergegebene Backup-Datei die Lizenz mitverteilen. Verlorene Schlüssel stellt
man mit `npm run license` neu aus.

**Lizenzprüfung verliert bei Netzproblemen nichts.** `verifyToken` unterscheidet
`valid` / `invalid` / `unreachable`; nur eine echte Ablehnung löscht die Lizenz.
Vorher hat ein Offline-Start zahlende Kunden ausgesperrt.

**Kein Kundenkonto, keine Kundendatenbank.** Stripe ist die einzige Quelle der
Wahrheit für „hat bezahlt". Kehrseite: Ein einmal ausgegebener Schlüssel läuft
weiter, auch nach einer Rückerstattung. Bei einem Einmalkauf ist das der Preis
für den fehlenden Server; falls es zum Problem wird, wäre eine Sperrliste in der
Verify-Funktion der nächste Schritt.

**Positionierung** steht in [`wettbewerb.md`](wettbewerb.md). Kurzfassung: Der
Einmalkauf und die lokale Datenhaltung sind die strukturellen Vorteile gegenüber
Migraine Buddy (89,99 $/Jahr, gibt aggregierte Daten an Pharma-Partner weiter)
und dem DiGA-/Abo-Feld.

## Wie man hier Änderungen prüft

```bash
npm run typecheck && npm run lint && npm run build
```

Für die App-Funktionen gibt es keine Unit-Tests, sondern Playwright gegen einen
echten Production-Build (`npm run build` + `vite preview --host 127.0.0.1`).
Zwei Stolpersteine dabei:

- Der Chromium muss explizit gesetzt werden — die Playwright-Version im Projekt
  erwartet einen anderen Build als den installierten:
  `chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })`
- `vite preview` braucht `--host 127.0.0.1`, sonst scheitert es an IPv6.

Der Bundle-Hash des lokalen Builds passt **nicht** zu dem auf GitHub Pages: Der
Pages-Workflow setzt `APP_BASE=/headache-harvest/`, was den Inhalt und damit den
Hash ändert. Einen Deploy prüft man über den Inhalt des ausgelieferten Bundles,
nicht über den Hash.
