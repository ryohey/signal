import type { AuthUser, IUserRepository, User } from "@signal-app/api"
import { makeObservable, observable } from "mobx"
import { createContext, useCallback, useContext, useMemo } from "react"
import { auth } from "../firebase/firebase"
import { isRunningInElectron } from "../helpers/platform"
import { userRepository } from "../services/repositories"
import { useMobxGetter } from "./useMobxSelector"

class AuthStore {
  authUser: AuthUser | null = null
  user: User | null = null

  constructor(private readonly userRepository: IUserRepository) {
    makeObservable(this, {
      authUser: observable,
      user: observable,
    })

    let subscribe: (() => void) | null = null

    try {
      userRepository.observeAuthUser(async (user) => {
        this.authUser = user

        if (isRunningInElectron()) {
          window.electronAPI.authStateChanged(user !== null)
        }

        subscribe?.()

        if (user !== null) {
          subscribe = userRepository.observeCurrentUser((user) => {
            this.user = user
          })
          await this.createProfileIfNeeded(user)
        }
      })
    } catch (e) {
      console.warn(e)
    }
  }

  private async createProfileIfNeeded(authUser: AuthUser) {
    // Create user profile if not exists
    const user = await this.userRepository.getCurrentUser()
    if (user === null) {
      const newUserData = {
        name: authUser.displayName ?? "",
        bio: "",
      }
      await this.userRepository.create(newUserData)
    }
  }

  get isLoggedIn() {
    return this.authUser !== null
  }
}

// biome-ignore lint/style/noNonNullAssertion: this is safe because of the provider
const AuthStoreContext = createContext<AuthStore>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authStore = useMemo(() => new AuthStore(userRepository), [])

  return (
    <AuthStoreContext.Provider value={authStore}>
      {children}
    </AuthStoreContext.Provider>
  )
}

export function useAuth() {
  const authStore = useContext(AuthStoreContext)

  return {
    get authUser() {
      return useMobxGetter(authStore, "authUser")
    },
    get user() {
      return useMobxGetter(authStore, "user")
    },
    get isLoggedIn() {
      return useMobxGetter(authStore, "isLoggedIn")
    },
    signOut: useCallback(async () => {
      await auth.signOut()
    }, []),
  }
}
