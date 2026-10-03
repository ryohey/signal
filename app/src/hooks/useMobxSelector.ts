import { IEqualsComparer, reaction } from "mobx"
import { useCallback, useRef } from "react"
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector"

type Selector<T> = () => T

export function useMobxSelector<T>(
  selector: Selector<T>,
  deps: any[],
  equals: IEqualsComparer<T> = Object.is,
): T {
  // Incremented by the reaction whenever the selected value changes
  const versionRef = useRef(0)
  const cacheRef = useRef<{
    selector: Selector<T>
    version: number
    value: T
  } | null>(null)

  // useSyncExternalStore requires getSnapshot to return the same value until
  // the store changes. Calling the selector each time does not guarantee this:
  // a computed value that nothing observes yet (e.g. Song.measures before the
  // reaction subscribes) is re-evaluated on every read and returns a new object.
  const getSnapshot = () => {
    const cache = cacheRef.current
    if (
      cache !== null &&
      cache.selector === selector &&
      cache.version === versionRef.current
    ) {
      return cache.value
    }
    const value = selector()
    cacheRef.current = { selector, version: versionRef.current, value }
    return value
  }

  return useSyncExternalStoreWithSelector(
    useCallback(
      (onStoreChange) =>
        reaction(
          selector,
          () => {
            versionRef.current++
            onStoreChange()
          },
          {
            fireImmediately: true,
            equals,
          },
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      deps,
    ),
    getSnapshot,
    undefined,
    useCallback((x) => x, []),
    equals,
  )
}

export function useMobxGetter<T, K extends keyof T>(
  store: T,
  prop: K,
  equals?: IEqualsComparer<T[K]>,
): T[K]
export function useMobxGetter<T, K extends keyof T>(
  store: T | undefined,
  prop: K,
  equals?: IEqualsComparer<T[K] | undefined>,
): T[K] | undefined
export function useMobxGetter<T, K extends keyof T>(
  store: T | undefined,
  prop: K,
  equals?: IEqualsComparer<T[K] | undefined>,
): T[K] | undefined {
  return useMobxSelector(() => store?.[prop], [store], equals)
}

export function useMobxSetter<T, K extends keyof T>(
  store: T,
  prop: K,
): (value: T[K]) => void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((value: T[K]) => (store[prop] = value), [store])
}
