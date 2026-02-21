import { readNoteStream, writeNoteStream } from "../io.js"

export interface VelocityOptions {
  set?: string
  add?: string
  scale?: string
  rampStart?: string
  rampEnd?: string
  randomMin?: string
  randomMax?: string
}

function clampVelocity(v: number): number {
  return Math.max(1, Math.min(127, Math.round(v)))
}

export async function velocityCommand(
  operation: string,
  values: string[],
  _options: VelocityOptions,
): Promise<void> {
  const stream = await readNoteStream()

  let notes = stream.notes

  switch (operation) {
    case "set": {
      const val = parseInt(values[0], 10)
      if (Number.isNaN(val))
        throw new Error(`Invalid velocity value: "${values[0]}"`)
      notes = notes.map((n) => ({ ...n, velocity: clampVelocity(val) }))
      break
    }

    case "add": {
      const delta = parseInt(values[0], 10)
      if (Number.isNaN(delta))
        throw new Error(`Invalid velocity delta: "${values[0]}"`)
      notes = notes.map((n) => ({
        ...n,
        velocity: clampVelocity(n.velocity + delta),
      }))
      break
    }

    case "scale": {
      const factor = parseFloat(values[0])
      if (Number.isNaN(factor))
        throw new Error(`Invalid scale factor: "${values[0]}"`)
      notes = notes.map((n) => ({
        ...n,
        velocity: clampVelocity(n.velocity * factor),
      }))
      break
    }

    case "ramp": {
      const start = parseInt(values[0], 10)
      const end = parseInt(values[1], 10)
      if (Number.isNaN(start) || Number.isNaN(end)) {
        throw new Error(`Invalid ramp values: "${values[0]}", "${values[1]}"`)
      }
      if (notes.length <= 1) {
        notes = notes.map((n) => ({ ...n, velocity: clampVelocity(start) }))
      } else {
        notes = notes.map((n, i) => {
          const t = i / (notes.length - 1)
          return { ...n, velocity: clampVelocity(start + (end - start) * t) }
        })
      }
      break
    }

    case "random": {
      const min = parseInt(values[0], 10)
      const max = parseInt(values[1], 10)
      if (Number.isNaN(min) || Number.isNaN(max)) {
        throw new Error(`Invalid random range: "${values[0]}", "${values[1]}"`)
      }
      notes = notes.map((n) => ({
        ...n,
        velocity: clampVelocity(min + Math.random() * (max - min)),
      }))
      break
    }

    default:
      throw new Error(
        `Unknown velocity operation: "${operation}". Expected: set, add, scale, ramp, random`,
      )
  }

  writeNoteStream({ context: stream.context, notes })
}
