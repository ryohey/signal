import { IEqualsComparer, reaction } from "mobx"
import { useCallback } from "react"
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector"

type Selector<T> = () => T

export function useMobxSelector<T>(
  selector: Selector<T>,
  deps: any[],
  equals: IEqualsComparer<T> = Object.is,
): T {
  return useSyncExternalStoreWithSelector(
    useCallback(
      (onStoreChange) =>
        reaction(selector, onStoreChange, {
          fireImmediately: true,
          equals,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      deps,
    ),
    selector,
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
