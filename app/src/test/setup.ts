import * as matchers from "@testing-library/jest-dom/matchers"
import { expect } from "vitest"

expect.extend(matchers)

beforeAll(() => {
  // Mock navigator.language
  Object.defineProperty(globalThis.navigator, "language", {
    value: "en",
    writable: true,
  })

  // Mock location
  Object.defineProperty(globalThis, "location", {
    value: {
      href: "https://signalmidi.app/",
    },
    writable: true,
  })
})
