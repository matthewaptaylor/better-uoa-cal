interface ImportMetaEnv {
  readonly VITE_TRPC_ENDPOINT: string;
  readonly VITE_CALENDAR_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
