import { hasStdinInput, readNoteStream, writeNoteStream } from "../io.js"
import { evaluateScript } from "../scripting/evaluator.js"
import type { NoteStream } from "../types.js"

/**
 * Execute a script with for/if/while constructs.
 *
 * The executor callback handles individual commands (e.g., transpose 2, add-notes C4).
 * It is injected so that the run command can reuse the same command dispatch
 * as the signal-midi CLI binary.
 */
export async function runCommand(
  script: string,
  executor: (command: string, stream: NoteStream) => NoteStream,
): Promise<void> {
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

  const result = evaluateScript(script, stream, executor)
  writeNoteStream(result)
}
