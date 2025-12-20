// @ts-nocheck
/* Fixed: Removed the problematic reference to 'vite/client' which was causing a 'Cannot find type definition file' error.
   Manual declarations for ImportMeta and ImportMetaEnv are provided to ensure type safety in the Vite environment. */

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Fixed: Augmenting the NodeJS namespace to include API_KEY in ProcessEnv for global availability.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
