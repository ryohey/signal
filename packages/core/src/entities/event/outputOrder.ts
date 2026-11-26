import { isBankLSBEvent, isBankMSBEvent, isProgramChangeEvent } from "./identify";
import type { TrackEvent } from "./TrackEvent";

/**
 * Moves a bank select that is stored after a program change on the same tick
 * to just before that program change, so it applies to it. Nothing else moves,
 * and a bank select stays where it is when a system exclusive (such as a
 * reset) sits between them. The events must already be ordered by tick, like
 * a track's events are.
 */
export const sortForOutput = <T extends TrackEvent>(events: readonly T[]) => {
  // Events are stored in the order they were added, so a bank select added to
  // an existing program change would otherwise come after it. An imported file
  // with a bank select after the program change on the same tick also plays it
  // with that program change, not the next one. We keep that because a bank
  // select on the same tick almost always belongs to that program change.
  const sorted = new Array<T>()
  // Where the first program change of the current tick went in sorted
  let programChangeIndex = -1
  for (const e of events) {
    const previous = sorted[sorted.length - 1]
    if (previous !== undefined && previous.tick !== e.tick) {
      programChangeIndex = -1
    }
    if (e.type === "sysEx" || e.type === "dividedSysEx") {
      programChangeIndex = -1
    }
    if (programChangeIndex >= 0 && (isBankMSBEvent(e) || isBankLSBEvent(e))) {
      sorted.splice(programChangeIndex, 0, e)
      programChangeIndex++
      continue
    }
    if (programChangeIndex < 0 && isProgramChangeEvent(e)) {
      programChangeIndex = sorted.length
    }
    sorted.push(e)
  }
  return sorted
}
