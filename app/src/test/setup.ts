import "@testing-library/jest-dom"
import { beforeAll } from "vitest"

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
