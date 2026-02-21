import { readNoteStream, writeNoteStream } from "../io.js"

/**
 * Shift notes in time.
 *
 * Amount formats:
 *   +120t or -120t  → shift by ticks
 *   +1b or -1b      → shift by beats
 *   +1m or -1m      → shift by measures
 *   120              → shift by ticks (positive)
 */
export async function shiftCommand(amount: string): Promise<void> {
  const stream = await readNoteStream()
  const { timebase, measures } = stream.context

  const delta = parseShiftAmount(amount, timebase, measures)

  const notes = stream.notes.map((note) => ({
    ...note,
    tick: Math.max(0, note.tick + delta),
  }))

  writeNoteStream({ context: stream.context, notes })
}

function parseShiftAmount(
  amount: string,
  timebase: number,
  measures: { numerator: number; denominator: number }[],
): number {
  const s = amount.trim()

  // Ticks: +120t, -120t, 120t
  const tickMatch = s.match(/^([+-]?\d+)t$/)
  if (tickMatch) {
    return parseInt(tickMatch[1], 10)
  }

  // Beats: +1b, -2b
  const beatMatch = s.match(/^([+-]?\d+)b$/)
  if (beatMatch) {
    const beats = parseInt(beatMatch[1], 10)
    // Use the first measure's denominator to calculate ticks per beat
    const denom = measures.length > 0 ? measures[0].denominator : 4
    const ticksPerBeat = (timebase * 4) / denom
    return Math.round(beats * ticksPerBeat)
  }

  // Measures: +1m, -1m
  const measureMatch = s.match(/^([+-]?\d+)m$/)
  if (measureMatch) {
    const numMeasures = parseInt(measureMatch[1], 10)
    const m =
      measures.length > 0 ? measures[0] : { numerator: 4, denominator: 4 }
    const ticksPerBeat = (timebase * 4) / m.denominator
    const ticksPerMeasure = ticksPerBeat * m.numerator
    return Math.round(numMeasures * ticksPerMeasure)
  }

  // Plain number = ticks
  const plain = parseInt(s, 10)
  if (!Number.isNaN(plain)) {
    return plain
  }

  throw new Error(
    `Invalid shift amount: "${amount}". Expected: <n>t (ticks), <n>b (beats), <n>m (measures), or a plain number`,
  )
}
