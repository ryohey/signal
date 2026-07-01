import { Unsubscribe } from "./types"

export interface Observable<T = void> {
  subscribe: (listener: (value: T) => void) => Unsubscribe
}
