import { type DependencyList, useEffect } from "react"

export function useAsyncEffect(effect: () => any, deps?: DependencyList) {
  useEffect(() => {
    effect()
    // biome-ignore lint/correctness/useExhaustiveDependencies: deps is array
  }, deps)
}
