import { IEqualsComparer, reaction } from "mobx"
import { useCallback, useMemo } from "react"
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector"

type Selector<T> = () => T

export function useMobxSelector<T>(
  selector: Selector<T>,
  deps: any[],
  equals: IEqualsComparer<T> = Object.is,
): T {
  // Cache the selector function reference to ensure getSnapshot is stable
  const stableSelector = useMemo(() => selector, deps)
  
  // Cache getSnapshot to avoid React 19 warning about infinite loops
  const getSnapshot = useCallback(() => stableSelector(), [stableSelector])
  
  return useSyncExternalStoreWithSelector(
    useCallback(
      (onStoreChange) =>
        reaction(stableSelector, onStoreChange, {
          fireImmediately: true,
          equals,
        }),
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
