import { describe, it, expect } from "vitest"
import type { SerializedNote } from "../../src/types.js"

function clampVelocity(v: number): number {
  return Math.max(1, Math.min(127, Math.round(v)))
}

describe("velocity operations", () => {
  const notes: SerializedNote[] = [
    { tick: 0, duration: 480, noteNumber: 60, velocity: 80 },
    { tick: 480, duration: 480, noteNumber: 62, velocity: 100 },
    { tick: 960, duration: 480, noteNumber: 64, velocity: 60 },
  ]

  it("set: replaces all velocities", () => {
    const result = notes.map((n) => ({ ...n, velocity: clampVelocity(90) }))
    expect(result.every((n) => n.velocity === 90)).toBe(true)
  })

  it("add: increases velocities", () => {
    const result = notes.map((n) => ({
      ...n,
      velocity: clampVelocity(n.velocity + 20),
    }))
    expect(result[0].velocity).toBe(100)
    expect(result[1].velocity).toBe(120)
    expect(result[2].velocity).toBe(80)
  })

  it("scale: multiplies velocities", () => {
    const result = notes.map((n) => ({
      ...n,
      velocity: clampVelocity(n.velocity * 0.5),
    }))
    expect(result[0].velocity).toBe(40)
    expect(result[1].velocity).toBe(50)
    expect(result[2].velocity).toBe(30)
  })

  it("ramp: creates linear velocity gradient", () => {
    const start = 40
    const end = 100
    const result = notes.map((n, i) => {
      const t = i / (notes.length - 1)
      return { ...n, velocity: clampVelocity(start + (end - start) * t) }
    })
    expect(result[0].velocity).toBe(40)
    expect(result[1].velocity).toBe(70)
    expect(result[2].velocity).toBe(100)
  })

  it("clamps velocity to 1-127", () => {
    expect(clampVelocity(0)).toBe(1)
    expect(clampVelocity(200)).toBe(127)
    expect(clampVelocity(-10)).toBe(1)
  })
})
