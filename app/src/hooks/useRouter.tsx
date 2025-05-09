import { makeObservable, observable } from "mobx"
import { createContext, useCallback, useContext, useMemo } from "react"
import { useMobxSelector } from "./useMobxSelector"

export type RoutePath = "/track" | "/arrange" | "/tempo"

class Router {
  path: RoutePath = "/track"

  constructor() {
    makeObservable(this, {
      path: observable,
    })
  }
}

const RouterContext = createContext(new Router())

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const router = useMemo(() => new Router(), [])

  return (
    <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
  )
}

export function useRouter() {
  const router = useContext(RouterContext)

  return {
    get path() {
      return useMobxSelector(() => router.path, [router])
    },
    setPath: useCallback(
      (path: RoutePath) => {
        router.path = path
      },
      [router],
    ),
  }
}
