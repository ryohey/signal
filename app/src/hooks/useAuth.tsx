import { AuthUser, User } from "@signal-app/api"
import { atom, useAtom, useAtomValue } from "jotai"
import { atomEffect } from "jotai-effect"
import { useCallback, useEffect } from "react"
import { auth } from "../firebase/firebase"
import { isRunningInElectron } from "../helpers/platform"
import { userRepository } from "../services/repositories"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useNotifyAuthUserToElectron()
  useAtom(authEffectAtom)
  return children
}

export function useAuth() {
  return {
    get authUser() {
      return useAtomValue(authUserAtom)
    },
    get user() {
      return useAtomValue(userAtom)
    },
    get isLoggedIn() {
      return useAtomValue(isLoggedInAtom)
    },
    signOut: useCallback(async () => {
      await auth.signOut()
    }, []),
  }
}

function useNotifyAuthUserToElectron() {
  useEffect(() => {
    try {
      userRepository.observeAuthUser(async (user) => {
        if (isRunningInElectron()) {
          window.electronAPI.authStateChanged(user !== null)
        }
      })
    } catch (e) {
      console.warn(e)
    }
  }, [])
}

// atoms

const authUserAtom = atom<AuthUser | null>(null)
const userAtom = atom<User | null>(null)
const isLoggedInAtom = atom((get) => get(authUserAtom) !== null)

// effects

const authEffectAtom = atomEffect((_get, set) => {
  let unsubscribe: (() => void) | null = null

  try {
    userRepository.observeAuthUser(async (user) => {
      set(authUserAtom, user)
      unsubscribe?.()

      if (user !== null) {
        unsubscribe = userRepository.observeCurrentUser((user) => {
          set(userAtom, user)
        })
        await createProfileIfNeeded(user)
      }
    })
  } catch (e) {
    console.warn(e)
  }
})

// Create user profile if not exists
async function createProfileIfNeeded(authUser: AuthUser) {
  const user = await userRepository.getCurrentUser()
  if (user === null) {
    const newUserData = {
      name: authUser.displayName ?? "",
      bio: "",
    }
    await userRepository.create(newUserData)
  }
}
