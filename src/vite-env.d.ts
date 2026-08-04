/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Operator details rendered into the imprint and privacy pages. */
  readonly VITE_LEGAL_NAME?: string;
  readonly VITE_LEGAL_ADDRESS?: string;
  readonly VITE_LEGAL_EMAIL?: string;
  readonly VITE_LEGAL_VAT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
