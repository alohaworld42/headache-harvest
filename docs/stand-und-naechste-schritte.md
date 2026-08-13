# Stand und nächste Schritte

Stand: `main` @ #9. Klickstrecke: [`verkaufsstart.md`](verkaufsstart.md).

## Offen — in dieser Reihenfolge

1. **Vercel-Projekt** anlegen: Dashboard → *Add New → Project* → Repo importieren.
   Vite wird erkannt, `vercel.json` liegt bei.
2. `STRIPE_SECRET_KEY=sk_test_… npm run setup:stripe` → legt Produkt + Preise an,
   gibt die Umgebungsvariablen aus. Wiederholbar.
3. Variablen in Vercel setzen (Production **und** Preview), neu deployen.
   `VITE_LEGAL_*` nicht vergessen — sie werden beim Build eingebacken, ein
   Nachtragen ohne Redeploy wirkt nicht.
4. `npm run preflight -- https://…vercel.app` → prüft Endpunkte, Preise,
   Lizenzsignatur und Impressum. Muss grün sein.
5. Testkauf mit `4242 4242 4242 4242`. Dann dasselbe mit `--live` und
   `LICENSE_SECRET=…` (sonst wird ein zweites erzeugt → alle verkauften
   Schlüssel ungültig). Danach Preflight gegen Production erneut.
6. Rechtstexte unter `/legal/*` prüfen lassen. Solange `VITE_LEGAL_*` fehlen,
   zeigen die Seiten einen roten Entwurfshinweis.
7. **Erst danach** Repo privat schalten — Pages liefert private Repos nur im
   bezahlten Plan aus.

## Fallen

- Vercel-MCP hilft nicht: einziger Deploy-Befehl erwartet den Dateibaum inline
  und erzeugt ein Projekt ohne Git-Anbindung.
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
