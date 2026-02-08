/** biome-ignore-all lint/suspicious/noExplicitAny: utility type */
export type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never
