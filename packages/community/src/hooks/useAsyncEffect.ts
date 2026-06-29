import { DependencyList, useEffect } from "react"

export function useAsyncEffect(effect: () => unknown, deps?: DependencyList) {
  useEffect(() => {
    effect()
    // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  }, deps)
}
