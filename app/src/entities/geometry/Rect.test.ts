import { describe, expect, it } from "vitest"
import { Rect } from "./Rect"

describe("Rect", () => {
  describe("intersects", () => {
    it("included", () => {
      expect(
        Rect.intersects(
          {
            x: 1,
            y: 1,
            width: 10,
            height: 10,
          },
          {
            x: 2,
            y: 2,
            width: 1,
            height: 1,
          }
        )
      ).toBeTruthy()

      expect(
        Rect.intersects(
          {
            x: 1,
            y: 1,
            width: 10,
            height: 10,
          },
          {
            x: 1,
            y: 1,
            width: 1,
            height: 1,
          }
        )
      ).toBeTruthy()
    })

    it("overlapped", () => {
      expect(
        Rect.intersects(
          {
            x: 1,
            y: 1,
            width: 2,
            height: 2,
          },
          {
            x: 2,
            y: 2,
            width: 1,
            height: 1,
          }
        )
      ).toBeTruthy()
    })

    it("separated", () => {
      expect(
        Rect.intersects(
          {
            x: 0,
            y: 0,
            width: 1,
            height: 1,
          },
          {
            x: 2,
            y: 2,
            width: 1,
            height: 1,
          }
        )
      ).toBeFalsy()
    })

    it("adjacent", () => {
      expect(
        Rect.intersects(
          {
            x: 1,
            y: 1,
            width: 1,
            height: 1,
          },
          {
            x: 2,
            y: 2,
            width: 1,
            height: 1,
          }
        )
      ).toBeFalsy()
    })

    it("zero", () => {
      expect(
        Rect.intersects(
          {
            x: 1,
            y: 1,
            width: 0,
            height: 0,
          },
          {
            x: 1,
            y: 1,
            width: 0,
            height: 0,
          }
        )
      ).toBeFalsy()
    })
  })
})
