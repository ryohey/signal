import {
  AuthUser,
  IUserRepository,
  User,
} from "/imports/signal/packages/api/src"
import { makeObservable, observable } from "mobx"
import { isRunningInElectron } from "../helpers/platform"

export class AuthStore {
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
