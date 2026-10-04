import type { AuthUser, IUserRepository, User } from "@signal-app/api"
import { makeObservable, observable } from "mobx"

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
