import { Emitter, Unsubscribe } from "@signal-app/observable"
import { useMemo, useSyncExternalStore } from "react"

interface DerivedValueOptions<T> {
  subscribeSource: (onSourceChange: () => void) => Unsubscribe
  deriveValue: () => T
}

class DerivedValue<T> {
  private readonly onChanged = new Emitter()
  private readonly subscribeSource: (onSourceChange: () => void) => Unsubscribe
  private readonly deriveValue: () => T
  private unsubscribeSource: Unsubscribe | null = null
  private value: T

  constructor(options: DerivedValueOptions<T>) {
    this.subscribeSource = options.subscribeSource
    this.deriveValue = options.deriveValue
    this.value = this.deriveValue()
  }

  subscribe = (listener: () => void) => {
    const unsubscribe = this.onChanged.subscribe(listener)
    if (this.onChanged.listenerCount === 1) {
      this.unsubscribeSource = this.subscribeSource(this.handleSourceChanged)
    }
    return () => {
      unsubscribe()
      if (this.onChanged.listenerCount === 0) {
        this.unsubscribeSource?.()
        this.unsubscribeSource = null
      }
    }
  }

  getSnapshot = () => this.value

  private handleSourceChanged = () => {
    const nextValue = this.deriveValue()
    if (Object.is(nextValue, this.value)) {
      return
    }
    this.value = nextValue
    this.onChanged.emit()
  }
}

/**
 * Subscribes to an external source and exposes a derived value through
 * useSyncExternalStore.
 *
 * The hook keeps a cached snapshot and updates it when the source notifies.
 * React re-renders only when the derived snapshot actually changes.
 *
 * Pass stable references for subscribeSource and deriveValue (for example,
 * with useCallback).
 */
export function useDerivedValue<T>(
  subscribeSource: (onSourceChange: () => void) => Unsubscribe,
  deriveValue: () => T,
): T {
  const derivedValue = useMemo(
    () => new DerivedValue({ subscribeSource, deriveValue }),
    [subscribeSource, deriveValue],
  )
  return useSyncExternalStore(derivedValue.subscribe, derivedValue.getSnapshot)
}
