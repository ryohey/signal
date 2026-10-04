// Vite and Vitest replace `import.meta.env` at build time. Where it is not
// defined, the code counts as production.
export const isDevelopment = (): boolean =>
  (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true
