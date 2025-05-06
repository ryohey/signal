import { IEqualsComparer, reaction } from "mobx"
import { useCallback, useSyncExternalStore } from "react"
import RootStore from "../stores/RootStore"
import { useStores } from "./useStores"

type Selector<T> = () => T

export function useMobxSelector<T>(
  selector: Selector<T>,
  deps: any[],
  equals?: IEqualsComparer<T>,
): T {
  return useSyncExternalStore(
    useCallback(
      (onStoreChange) =>
        reaction(selector, onStoreChange, {
          fireImmediately: true,
          equals,
        }),
      deps,
    ),
    selector,
  )
}

export function useMobxStore<T>(
  selector: (rootStore: RootStore) => T,
  equals?: IEqualsComparer<T>,
): T {
  const rootStore = useStores()
  return useMobxSelector(() => selector(rootStore), [rootStore], equals)
}
