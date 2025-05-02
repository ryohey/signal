import { useCallback } from "react"
import { auth } from "../firebase/firebase"
import { useMobxStore } from "./useMobxSelector"

export function useAuth() {
  return {
    get authUser() {
      return useMobxStore(({ authStore }) => authStore.authUser)
    },
    get user() {
      return useMobxStore(({ authStore }) => authStore.user)
    },
    get isLoggedIn() {
      return useMobxStore(({ authStore }) => authStore.isLoggedIn)
    },
    signOut: useCallback(async () => {
      await auth.signOut()
    }, []),
  }
}
