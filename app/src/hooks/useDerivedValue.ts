import { Unsubscribe } from "@signal-app/observable"
import { useCallback, useRef, useSyncExternalStore } from "react"

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
  const deriveValueRef = useRef(deriveValue)

  const valueRef = useRef<{ initialized: boolean; value: T | undefined }>({
    initialized: false,
    value: undefined,
  })

  if (!valueRef.current.initialized) {
    valueRef.current = {
      initialized: true,
      value: deriveValue(),
    }
  }

  if (deriveValueRef.current !== deriveValue) {
    deriveValueRef.current = deriveValue
    const nextValue = deriveValue()
    if (!Object.is(nextValue, valueRef.current.value)) {
      valueRef.current.value = nextValue
    }
  }

  const subscribe = useCallback(
    (listener: () => void) =>
      subscribeSource(() => {
        const nextValue = deriveValueRef.current()
        if (Object.is(nextValue, valueRef.current.value)) {
          return
        }
        valueRef.current.value = nextValue
        listener()
      }),
    [subscribeSource],
  )

  const getSnapshot = useCallback(() => valueRef.current.value as T, [])

  return useSyncExternalStore(subscribe, getSnapshot)
}
