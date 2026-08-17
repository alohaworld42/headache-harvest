# schmerzverlauf.de mit dem Vercel-Projekt verbinden

Die Domain liegt bei Strato, die App läuft auf Vercel. Verbunden wird das über
**DNS-Einträge bei Strato**, die auf Vercel zeigen — die Domain bleibt dabei bei
Strato registriert, es wird nichts umgezogen.

## Deployment Protection steht nicht im Weg

Das Projekt hat Vercel Authentication an, aber im Modus
`all_except_custom_domains` (geprüft 2026-08-17 über
`get_project_deployment_protection`). Custom Domains sind davon **ausgenommen**:
`schmerzverlauf.de` ist ab dem Verbinden ohne Login erreichbar, während die
`*.vercel.app`-Adressen hinter der SSO-Wand bleiben.

Das ist die brauchbare Konstellation — Vorschau-URLs privat, Live-Domain
öffentlich. Der Schutz muss dafür nicht angefasst werden.

## 1. Domain in Vercel eintragen

*Vercel → Projekt → Settings → Domains → Add*

Beide Varianten hinzufügen:

- `schmerzverlauf.de`
- `www.schmerzverlauf.de`

Vercel fragt, welche die primäre sein soll und leitet die andere per 308 dorthin
um. Empfehlung: **`schmerzverlauf.de` als primär**, `www` leitet weiter — die App
tritt überall ohne `www` auf, und die kürzere Adresse ist auf einem Beipackzettel
oder in einer Arztpraxis leichter vorzulesen.

Danach zeigt Vercel pro Eintrag die benötigten DNS-Werte an. **Diese angezeigten
Werte sind maßgeblich**, nicht die unten genannten: Vercel hat mehrere
Anycast-Adressen im Einsatz und stellt gerade um, deshalb bekommt nicht jedes
Projekt dieselbe IP.

## 2. DNS bei Strato setzen

*Strato-Kundenlogin → Domainverwaltung → schmerzverlauf.de → Verwalten →
DNS-Einstellungen* (je nach Oberfläche „Nameserver / DNS" oder
„Erweiterte Einstellungen").

| Typ   | Name (Host)   | Wert                                     |
| ----- | ------------- | ---------------------------------------- |
| A     | `@` (leer)    | die von Vercel angezeigte IPv4-Adresse   |
| CNAME | `www`         | der von Vercel angezeigte CNAME-Zielwert |

Zur Einordnung, falls die Oberfläche einen Wert vorschlägt: Vercel nennt für den
A-Record je nach Projekt `76.76.21.21` (bisher) oder `216.198.79.1` (neuer). Der
CNAME-Zielwert ist projektspezifisch und endet auf `.vercel-dns.com` bzw.
`.vercel-dns-0??.com`. **Immer den Wert aus dem Vercel-Dashboard übernehmen.**

Drei Strato-Eigenheiten, die den Schritt sonst still scheitern lassen:

1. **Domain-Parking / Weiterleitung deaktivieren.** Strato legt neu bestellte
   Domains auf eine Platzhalterseite oder eine Weiterleitung. Solange die aktiv
   ist, überschreibt sie den A-Record und die Seite bleibt die Strato-Seite. Zu
   finden unter *Domainverwaltung → Zielinhalt / Verwendung*, dort auf „eigene
   DNS-Einstellungen" bzw. „kein Zielinhalt" stellen.
2. **Nicht auf Vercel-Nameserver umstellen.** Der A/CNAME-Weg oben reicht. Ein
   Nameserver-Wechsel nimmt Strato die Zone weg — und damit auch die
   MX-Einträge. Falls je eine Mailadresse `@schmerzverlauf.de` bei Strato
   eingerichtet wird, wäre die danach tot.
3. **MX- und TXT-Einträge in Ruhe lassen.** Nur den A-Record für `@` und den
   CNAME für `www` anfassen.

Rechne mit 15 Minuten bis wenigen Stunden, bis die Änderung greift; Strato gibt
teilweise lange TTLs aus. In Vercel unter *Settings → Domains* wechselt der
Status dann von „Invalid Configuration" auf „Valid". Das TLS-Zertifikat stellt
Vercel danach automatisch aus, ohne Zutun.

Prüfen lässt sich der Stand jederzeit von außen:

```bash
dig +short schmerzverlauf.de
dig +short www.schmerzverlauf.de
```

## 3. `APP_URL` setzen und neu deployen

*Vercel → Settings → Environment Variables*, für **Production**:

```
APP_URL=https://schmerzverlauf.de
```

Stripe leitet nach dem Kauf hierhin zurück (`/pro/success`). Ohne die Variable
nimmt `api/checkout.ts` den Host der Anfrage — das funktioniert, schickt Käufer
aber je nach Einstiegspunkt auf die `*.vercel.app`-Adresse zurück.

Anschließend **einmal neu deployen**. Die `VITE_LEGAL_*`-Variablen werden beim
Build eingebacken; ohne Redeploy wirkt kein Nachtrag.

## 4. Prüfen

```bash
npm run preflight -- https://schmerzverlauf.de
```

Prüft SPA-Rewrite auf der Stripe-Rückleitung, `/api/checkout` mit aufgelösten
Preisen, dass `/api/license` einen gefälschten Token ablehnt, und dass keine
Impressum-Platzhalter mehr im Bundle stecken.

Bricht das Skript mit Exit 2 ab, läuft es gegen die SSO-Wand — das heißt „konnte
nicht prüfen", nicht „geprüft und kaputt". Gegen `schmerzverlauf.de` darf das
nicht passieren; gegen eine `*.vercel.app`-Adresse ist es zu erwarten.

Danach von Hand: `https://schmerzverlauf.de/legal/imprint` direkt aufrufen (nicht
über die Navigation) — lädt die Seite, greift der SPA-Rewrite. Und
`https://www.schmerzverlauf.de` muss auf die Variante ohne `www` umleiten.

## Was im Repository bereits auf die Domain zeigt

Die Domain steht an genau einer Stelle im Code: `SITE_URL` in `vite.config.ts`,
Standardwert `https://schmerzverlauf.de`. Daraus entstehen beim Build

- der `canonical`-Link und die Open-Graph-Tags in `index.html` (absolut — Crawler
  für Link-Vorschauen lösen relative Bildpfade nicht auf),
- `robots.txt` und `sitemap.xml`.

`src/App.tsx` zieht den `canonical`-Link bei jedem Routenwechsel auf die aktuelle
Route nach, weil für alle Routen dieselbe `index.html` ausgeliefert wird.

Damit zeigt auch die GitHub-Pages-Vorschau per `canonical` auf die Live-Domain
und tritt in der Suche nicht gegen sie an. Eine andere Adresse braucht kein
Code-Änderung, sondern `SITE_URL=https://… npm run build`.
