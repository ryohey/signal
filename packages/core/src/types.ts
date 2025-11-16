export type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never

export type Branded<T, U> = T & { __brand: U }

export type Unsubscribe = () => void
