import { describe, expect, it } from "vitest"
import { clearInvalidCreationDate } from "./clearInvalidCreationDate"

const chunk = (id: string, body: number[]) => {
  const size = body.length
  const padding = size % 2 === 1 ? [0] : []
  return [
    ...[...id].map((c) => c.charCodeAt(0)),
    size & 0xff,
    (size >> 8) & 0xff,
    (size >> 16) & 0xff,
    (size >> 24) & 0xff,
    ...body,
    ...padding,
  ]
}

const text = (value: string) => [...value].map((c) => c.charCodeAt(0))

// A minimal sound bank with an INFO list containing the given ICRD value
const createSoundBank = (creationDate: string) => {
  const info = chunk("LIST", [
    ...text("INFO"),
    ...chunk("ifil", [2, 0, 1, 0]),
    ...chunk("ICRD", [...text(creationDate), 0]),
    ...chunk("INAM", [...text("Test"), 0]),
  ])
  const sdta = chunk("LIST", text("sdta"))
  return new Uint8Array(chunk("RIFF", [...text("sfbk"), ...info, ...sdta]))
    .buffer
}

const readCreationDate = (data: ArrayBuffer) => {
  const bytes = new Uint8Array(data)
  const start = bytes.findIndex(
    (_, i) => String.fromCharCode(...bytes.slice(i, i + 4)) === "ICRD",
  )
  return bytes.slice(start + 8, start + 16)
}

describe("clearInvalidCreationDate", () => {
  it("clears a creation date that cannot be parsed", () => {
    const data = createSoundBank("17-7-05")

    const result = clearInvalidCreationDate(data)

    expect(result).not.toBe(data)
    expect([...readCreationDate(result)]).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
    expect(result.byteLength).toBe(data.byteLength)
    // The original data is left untouched
    expect(String.fromCharCode(...readCreationDate(data).slice(0, 7))).toBe(
      "17-7-05",
    )
  })

  it("keeps a creation date that can be parsed", () => {
    const data = createSoundBank("2005-07-17")

    expect(clearInvalidCreationDate(data)).toBe(data)
  })

  it("returns data that is not a RIFF file unchanged", () => {
    const data = new Uint8Array([1, 2, 3]).buffer

    expect(clearInvalidCreationDate(data)).toBe(data)
  })
})
