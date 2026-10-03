// Sound banks store their creation date as free text in the ICRD chunk of the
// INFO list. When spessasynth cannot parse it (e.g. "17-7-05" in the bundled
// A320U sound fonts) it logs a warning and uses the current date instead.
// Blanking the value ahead of time gives the same result without the warning.
// Returns a copy of the data when the date was cleared, otherwise the input.
export function clearInvalidCreationDate(data: ArrayBuffer): ArrayBuffer {
  const range = findCreationDate(data)
  if (range === null) {
    return data
  }
  const [start, end] = range
  const bytes = new Uint8Array(data, start, end - start)
  const nullIndex = bytes.indexOf(0)
  const text = new TextDecoder("latin1")
    .decode(nullIndex === -1 ? bytes : bytes.subarray(0, nullIndex))
    .trim()
  if (text.length === 0 || !Number.isNaN(new Date(text).getTime())) {
    return data
  }
  const copy = data.slice(0)
  new Uint8Array(copy, start, end - start).fill(0)
  return copy
}

// Returns the byte range of the ICRD value, or null if there is none
function findCreationDate(data: ArrayBuffer): [number, number] | null {
  const view = new DataView(data)
  const readId = (offset: number) =>
    String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    )

  if (data.byteLength < 12 || readId(0) !== "RIFF") {
    return null
  }
  const riffEnd = Math.min(data.byteLength, 8 + view.getUint32(4, true))

  for (let offset = 12; offset + 8 <= riffEnd; ) {
    const id = readId(offset)
    const size = view.getUint32(offset + 4, true)
    const end = Math.min(riffEnd, offset + 8 + size)

    if (id === "LIST" && offset + 12 <= end && readId(offset + 8) === "INFO") {
      for (let sub = offset + 12; sub + 8 <= end; ) {
        const subSize = view.getUint32(sub + 4, true)
        if (readId(sub) === "ICRD") {
          return [sub + 8, Math.min(end, sub + 8 + subSize)]
        }
        sub += 8 + subSize + (subSize % 2)
      }
      return null
    }
    offset += 8 + size + (size % 2)
  }
  return null
}
