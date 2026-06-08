import { Observable } from "./observable"

export class Emitter implements Observable {
  private listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emit = () => {
    this.listeners.forEach((listener) => listener())
  }

  get listenerCount() {
    return this.listeners.size
  }
}
