import { hasStdinInput, readNoteStream, writeNoteStream } from "../io.js"
import type { NoteStream } from "../types.js"

export async function letCommand(assignments: string[]): Promise<void> {
  let stream: NoteStream
  if (hasStdinInput()) {
    stream = await readNoteStream()
  } else {
    stream = {
      context: {
        timebase: 480,
        measures: [{ tick: 0, measure: 0, numerator: 4, denominator: 4 }],
      },
      notes: [],
    }
  }

  const vars: Record<string, string> = { ...stream.context.vars }

  for (const assignment of assignments) {
    const eqIndex = assignment.indexOf("=")
    if (eqIndex < 0) {
      throw new Error(
        `Invalid assignment: "${assignment}". Expected: name=value`,
      )
    }
    const name = assignment.slice(0, eqIndex).trim()
    const value = assignment.slice(eqIndex + 1).trim()
    vars[name] = value
  }

  writeNoteStream({
    context: { ...stream.context, vars },
    notes: stream.notes,
  })
}
