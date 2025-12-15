import { DependencyList, useEffect } from "react"

export function useAsyncEffect(effect: () => any, deps?: DependencyList) {
  useEffect(() => {
    effect()
  }, deps)
}
