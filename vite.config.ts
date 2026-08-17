import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Absolute origin used for the canonical link and the Open Graph tags in index.html.
// No trailing slash — the template appends the path. Override via SITE_URL when the
// app is served from somewhere else; the default is the domain we actually sell under.
const SITE_URL = (process.env.SITE_URL ?? 'https://schmerzverlauf.de').replace(/\/+$/, '');

export default defineConfig({
  // Root path on Vercel; the GitHub Pages workflow overrides it with the repo sub-path.
  base: process.env.APP_BASE ?? '/',
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    {
      // Vite only substitutes %BASE_URL% and VITE_-prefixed vars in HTML, and it leaves
      // an unset placeholder verbatim in the output. Doing it here keeps the default.
      // `pre` is required: Vite's own HTML pass runs decodeURI over every href it finds,
      // and a literal `%SI…` reads as a malformed escape sequence and aborts the build.
      name: 'site-url-html',
      transformIndexHtml: {
        order: 'pre' as const,
        handler: (html: string) => html.replaceAll('%SITE_URL%', SITE_URL),
      },
    },
    {
      // Generated rather than checked into public/ so the domain lives in exactly one
      // place. Only pages worth landing on are listed — the calendar, insights, report
      // and settings views hold no server-rendered content, and /pro/success is reached
      // from Stripe, not from a search result.
      name: 'site-url-robots-sitemap',
      apply: 'build',
      generateBundle() {
        const pages = ['/', '/clinicians', '/legal/privacy', '/legal/terms', '/legal/imprint'];
        const urls = pages
          .map((page) => `  <url><loc>${SITE_URL}${page}</loc></url>`)
          .join('\n');

        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
        });
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source:
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            `${urls}\n` +
            '</urlset>\n',
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
