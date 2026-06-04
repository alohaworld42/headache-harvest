# Kopfschmerz-Kalender (Headache Harvest)

Eine kleine Web-App zum Erfassen und Analysieren von Kopfschmerzen. Trage deine
Kopfschmerz-Episoden in einen Kalender ein und erkenne über die Statistik-Ansicht
Muster bei Auslösern, Symptomen, Dauer und Intensität.

**Privacy first:** Alle Daten bleiben ausschließlich lokal im `localStorage` deines
Browsers. Es gibt kein Backend, nichts wird hochgeladen.

## Features

- 📅 **Kalender** – monatliche Übersicht, farbcodiert nach Schmerzintensität
- 📝 **Mehrstufiges Eingabeformular** – Intensität, Dauer, Lokalisation, Symptome,
  Auslöser, Medikamente und deren Wirksamkeit, plus Notizen
- 📊 **Statistiken** – Diagramme zu Intensität, Dauer, häufigen Auslösern und
  Begleitsymptomen, mit automatisch abgeleiteten Insights
- 💾 **Export / Import** – sichere deine Einträge als JSON und spiele sie wieder ein
- 🌙 Dark-Mode-Unterstützung

## Tech Stack

Vite · React 18 · TypeScript · React Router · shadcn/ui (Radix) · Tailwind CSS ·
Recharts · date-fns

## Lokale Entwicklung

Voraussetzung: Node.js 20+.

```bash
npm install
npm run dev      # Dev-Server (http://localhost:8080/headache-harvest/)
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal vorschauen
npm run lint     # ESLint
```

## Deployment

Die App wird automatisch auf **GitHub Pages** veröffentlicht. Jeder Push auf `main`
löst den Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) aus,
der die App baut und deployt.

Live: https://alohaworld42.github.io/headache-harvest/

Da es sich um eine Single-Page-App handelt, kopiert der Build `index.html` zusätzlich
nach `404.html`, damit Deep-Links und Reloads korrekt funktionieren. Die `base` ist
in [`vite.config.ts`](vite.config.ts) auf `/headache-harvest/` gesetzt.
