/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // otros vars
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
