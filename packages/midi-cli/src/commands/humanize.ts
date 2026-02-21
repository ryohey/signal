import { readNoteStream, writeNoteStream } from "../io.js"

export interface HumanizeOptions {
  time?: string // max tick deviation
  velocity?: string // max velocity deviation
}

export async function humanizeCommand(options: HumanizeOptions): Promise<void> {
  const stream = await readNoteStream()

  const maxTimeDelta = options.time ? parseInt(options.time, 10) : 0
  const maxVelDelta = options.velocity ? parseInt(options.velocity, 10) : 0

  if (Number.isNaN(maxTimeDelta)) {
    throw new Error(`Invalid time value: "${options.time}"`)
  }
  if (Number.isNaN(maxVelDelta)) {
    throw new Error(`Invalid velocity value: "${options.velocity}"`)
  }

  const notes = stream.notes.map((note) => {
    let { tick, velocity } = note

    if (maxTimeDelta > 0) {
      const timeDelta = Math.round((Math.random() * 2 - 1) * maxTimeDelta)
      tick = Math.max(0, tick + timeDelta)
    }

    if (maxVelDelta > 0) {
      const velDelta = Math.round((Math.random() * 2 - 1) * maxVelDelta)
      velocity = Math.max(1, Math.min(127, velocity + velDelta))
    }

    return { ...note, tick, velocity }
  })

  writeNoteStream({ context: stream.context, notes })
}
