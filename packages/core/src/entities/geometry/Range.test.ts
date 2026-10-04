import { describe, expect, it } from "vitest"
import { Range } from "./Range"

describe("Range", () => {
  it("create rejects start > end in development", () => {
    expect(() => Range.create(10, 5)).toThrow()
  })

  it("create returns [start, end]", () => {
    expect(Range.create(5, 10)).toStrictEqual([5, 10])
  })
})
