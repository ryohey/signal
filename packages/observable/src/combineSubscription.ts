import { Unsubscribe } from "./types"

type Subscribe = (listener: () => void) => Unsubscribe

export const combineSubscription =
  (subscribes: readonly Subscribe[]) =>
  (listener: () => void): Unsubscribe => {
    const unsubscribes = subscribes.map((subscribe) => subscribe(listener))
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }
