/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Augmenting the NodeJS namespace to include API_KEY in ProcessEnv
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
