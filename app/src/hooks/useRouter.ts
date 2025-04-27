import { useCallback } from "react"
import { RoutePath } from "../stores/Router"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useRouter() {
  const { router } = useStores()

  return {
    get path() {
      return useMobxStore(({ router }) => router.path)
    },
    setPath: useCallback(
      (path: RoutePath) => {
        router.path = path
      },
      [router],
    ),
  }
}
