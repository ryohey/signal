import { reaction } from "mobx"
import { useCallback, useSyncExternalStore } from "react"
import RootStore from "../stores/RootStore"
import { useStores } from "./useStores"

type Selector<T> = (store: RootStore) => T

export function useMobxSelector<T>(selector: Selector<T>): T {
  const rootStore = useStores()
  const getter = useCallback(() => selector(rootStore), [rootStore])

  return useSyncExternalStore(
    useCallback(
      (onStoreChange) =>
        reaction(getter, onStoreChange, {
          fireImmediately: true,
        }),
      [getter],
    ),
    getter,
  )
}
