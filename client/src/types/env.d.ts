interface ImportMetaEnv {
  /**
   * For security purposes, this is the only username that can request a new token.
   */
  readonly VITE_REQUIRED_USERNAME: string;
  readonly VITE_TRPC_ENDPOINT: string;
  readonly VITE_CALENDAR_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
