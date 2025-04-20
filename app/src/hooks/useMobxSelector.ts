import { reaction } from "mobx"
import { useSyncExternalStore } from "react"

type Selector<T> = () => T

export function useMobxSelector<T>(selector: Selector<T>): T {
  return useSyncExternalStore(
    (onStoreChange) => {
      const disposer = reaction(selector, () => onStoreChange(), {
        fireImmediately: true,
      })
      return disposer
    },
    () => selector(),
  )
}
