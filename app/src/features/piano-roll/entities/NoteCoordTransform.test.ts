import { describe, expect, it } from "vitest"
import { TickTransform } from "../../../entities/transform/TickTransform"
import { KeyTransform } from "../entities/KeyTransform"
import { NoteCoordTransform } from "./NoteCoordTransform"

describe("NoteCoordTransform", () => {
  const t = new NoteCoordTransform(
    new TickTransform(100),
    new KeyTransform(30, 127),
  )

  it("constructor", () => {
    expect(t).not.toBeNull()
  })

  it("getX", () => {
    expect(t.getX(0)).toBe(0)
    expect(t.getX(1)).toBe(100)
  })

  it("getY", () => {
    expect(t.getY(127)).toBe(0)
    expect(t.getY(0)).toBe(30 * 127)
  })
})
