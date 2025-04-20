import { reaction } from "mobx"
import { useCallback, useSyncExternalStore } from "react"
import RootStore from "../stores/RootStore"
import { useStores } from "./useStores"

type Selector<T> = () => T

export function useMobxSelector<T>(selector: Selector<T>, deps: any[]): T {
  return useSyncExternalStore(
    useCallback(
      (onStoreChange) =>
        reaction(selector, onStoreChange, {
          fireImmediately: true,
        }),
      [deps],
    ),
    selector,
  )
}

export function useMobxStore<T>(selector: (rootStore: RootStore) => T): T {
  const rootStore = useStores()
  const getter = useCallback(() => selector(rootStore), [rootStore])
  return useMobxSelector(getter, [getter])
}
