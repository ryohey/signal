import { Observable } from "./observable"
import { Unsubscribe } from "./types"

type Subscribe<T = void> = Observable<T>["subscribe"]

// Re-subscribes to the latest inner observable whenever the outer observable emits.
export const switchSubscription = <Outer = void, Inner = void>(
  outerSubscribe: Subscribe<Outer>,
  getInnerSubscribe: () => Subscribe<Inner> | null | undefined,
) => {
  return (listener: (value: Inner) => void): Unsubscribe => {
    let innerUnsubscribe: Unsubscribe | null = null

    const resubscribe = () => {
      innerUnsubscribe?.()
      innerUnsubscribe = getInnerSubscribe()?.(listener) ?? null
    }

    const outerUnsubscribe = outerSubscribe(() => {
      resubscribe()
    })

    resubscribe()

    return () => {
      innerUnsubscribe?.()
      outerUnsubscribe()
    }
  }
}
