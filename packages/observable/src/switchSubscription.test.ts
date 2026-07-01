import { describe, expect, it } from "vitest"
import { Emitter } from "./emitter"
import { switchSubscription } from "./switchSubscription"

describe("switchSubscription", () => {
  it("switches to the latest inner subscription", () => {
    const outer = new Emitter()
    const firstInner = new Emitter()
    const secondInner = new Emitter()
    let currentInner = firstInner
    let count = 0

    const unsubscribe = switchSubscription(
      outer.subscribe,
      () => currentInner.subscribe,
    )(() => {
      count += 1
    })

    firstInner.emit()
    currentInner = secondInner
    outer.emit()
    firstInner.emit()
    secondInner.emit()

    unsubscribe()
    secondInner.emit()

    expect(count).toBe(2)
  })
})
