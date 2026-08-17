# Stand und nächste Schritte

Stand: `main` @ #20. Klickstrecke: [`verkaufsstart.md`](verkaufsstart.md).

`typecheck`, `lint`, `build` laufen grün (verifiziert 2026-08-17). Vercel-MCP ist
seit 2026-08-17 autorisiert — `list_teams` liefert `alohaworld42s-projects`,
Projekt- und Protection-Endpunkte antworten. Ein Tool zum Eintragen einer Custom
Domain hat der MCP-Server allerdings nicht.

Vercel-Projekt existiert und baut jeden Push:
`headache-harvest-alohaworld42s-projects.vercel.app`

Domain `schmerzverlauf.de` ist bei Strato registriert, aber noch nicht verbunden.
Klickstrecke dafür: [`domain-verbinden.md`](domain-verbinden.md). Die Code-Seite
ist fertig, offen sind nur Vercel- und Strato-Einstellungen.

## Offen — in dieser Reihenfolge

1. **Domain verbinden.** In Vercel `schmerzverlauf.de` und `www.` eintragen, bei
   Strato A-Record (`@`) und CNAME (`www`) auf die von Vercel angezeigten Werte
   setzen, Strato-Domain-Parking abschalten. Nicht auf Vercel-Nameserver
   umstellen — das nähme Strato die MX-Einträge weg. Details und Fallstricke:
   [`domain-verbinden.md`](domain-verbinden.md).

   **Deployment Protection muss dafür nicht ausgeschaltet werden.** Sie läuft im
   Modus `all_except_custom_domains` (geprüft 2026-08-17), nimmt Custom Domains
   also aus: `schmerzverlauf.de` ist ab dem Verbinden ohne Login erreichbar,
   `*.vercel.app` bleibt privat. Genau die gewünschte Konstellation.
2. `STRIPE_SECRET_KEY=sk_test_… npm run setup:stripe` → legt Produkt + Preise an,
   gibt die Umgebungsvariablen aus. Wiederholbar. `--dry-run true` mit einem
   Platzhalter-Key (ohne echten Stripe-Zugriff) am 2026-08-13 durchlaufen
   lassen: Skript rechnet 17,99 €/7,99 € korrekt in Cent um, kein Absturz.
   Ersetzt nicht den echten Lauf mit einem gültigen `STRIPE_SECRET_KEY`, den
   nur der Account-Owner hat.
3. Variablen in Vercel setzen (Production **und** Preview), neu deployen.
   `VITE_LEGAL_*` nicht vergessen — sie werden beim Build eingebacken, ein
   Nachtragen ohne Redeploy wirkt nicht.
4. `npm run preflight -- https://…vercel.app` → prüft Endpunkte, Preise,
   Lizenzsignatur und Impressum. Muss grün sein.
5. Testkauf mit `4242 4242 4242 4242`. Dann dasselbe mit `--live` und
   `LICENSE_SECRET=…` (sonst wird ein zweites erzeugt → alle verkauften
   Schlüssel ungültig). Danach Preflight gegen Production erneut.
6. Rechtstexte unter `/legal/*` prüfen lassen. Solange `VITE_LEGAL_*` fehlen,
   zeigen die Seiten einen roten Entwurfshinweis. Inhalt (`src/pages/Legal.tsx`)
   am 2026-08-13 gegengelesen: Datenschutz, AGB und Impressum sind vollständig,
   beide Sprachen konsistent, i18n-Keys vorhanden, Entwurfshinweis greift
   korrekt ohne `VITE_LEGAL_*`. Kein Ersatz für eine echte Rechtsprüfung durch
   eine Person — nur ein Plausibilitäts-Check ohne offensichtliche Lücken.
7. **Erst danach** Repo privat schalten — Pages liefert private Repos nur im
   bezahlten Plan aus.

## Fallen

- Vercel-MCP kann **keine Custom Domain eintragen**. Der Server hat dafür kein
  Tool: `check_domain_availability_and_price` und `get_domain_order` beziehen
  sich auf den Kauf über Vercel, nicht auf das Zuordnen einer fremd
  registrierten Domain. Bleibt Dashboard-Handarbeit oder ein Vercel-Token gegen
  `POST /v10/projects/{id}/domains`.
- „Connector verbunden" ≠ „Team autorisiert". Der Connector kann in
  `ListConnectors` als `connected: true` stehen, während `list_teams` `[]`
  liefert und jeder Projekt-Endpunkt `403` gibt — dann deckt das OAuth-Grant das
  Team nicht ab, und auch explizit mitgegebene `teamId`/`projectId` helfen
  nicht. Fix ist eine Re-Autorisierung, bei der das Team ausgewählt wird
  (2026-08-17 so passiert und behoben).
- Preflight bricht mit Exit 2 ab, wenn er gegen die SSO-Wand läuft — das ist
  „konnte nicht prüfen", nicht „geprüft und kaputt". Gegen `schmerzverlauf.de`
  darf das nicht passieren, gegen `*.vercel.app` ist es zu erwarten.
- Playwright braucht `executablePath:
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`.
- `vite preview --host 127.0.0.1`, sonst IPv6-Fehler.
- Bundle-Hash lokal ≠ Pages (`APP_BASE`). Deploy über den **Inhalt** prüfen.

## Entscheidungen

- `ProStatus.paid` (nur Kauf) getrennt von `active` (Kauf *oder* Test) — der
  Arztbericht hängt an `paid`.
- `ProGate` rendert einen Platzhalter statt zu blurren; eine CSS-Klasse wäre in
  Sekunden entfernt gewesen.
- Kein WASM-SQLite (~1 MB für Abfragen, die die App nicht braucht), stattdessen
  verschlüsselter JSON-Umschlag. Bei Platzmangel: IndexedDB, nicht SQLite.
- Backup enthält den Lizenzschlüssel **nicht** — sonst verteilt eine
  weitergegebene Datei die Lizenz mit. Ersatz: `npm run license`.
- `verifyToken` ist Tri-State (`valid`/`invalid`/`unreachable`); nur echte
  Ablehnung löscht die Lizenz. Vorher sperrte ein Offline-Start Kunden aus.
- Keine Kundendatenbank, Stripe ist die Wahrheit. Kehrseite: ausgegebene
  Schlüssel laufen auch nach Rückerstattung weiter. Fix wäre eine Sperrliste.

Prüfen: `npm run typecheck && npm run lint && npm run build`.
Positionierung: [`wettbewerb.md`](wettbewerb.md).
