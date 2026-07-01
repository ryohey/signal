import { Observable } from "./observable"

export class Emitter<T = void> implements Observable<T> {
  private listeners = new Set<(value: T) => void>()

  subscribe = (listener: (value: T) => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit = (value: T) => {
    for (const listener of [...this.listeners]) {
      listener(value)
    }
  }

  get listenerCount() {
    return this.listeners.size
  }
}
