export interface Observable {
  subscribe: (listener: () => void) => () => void
}
