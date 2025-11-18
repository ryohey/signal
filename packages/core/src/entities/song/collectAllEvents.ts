import { AnyChannelEvent } from "midifile-ts"
import { deassemble as deassembleNote } from "../../midi/noteAssembler"
import { Track, TrackId } from "../track/Track"
import { TrackEvent } from "../track/TrackEvent"

type CollectableEvent = AnyChannelEvent & {
  tick: number
  trackId: TrackId
}

type CollectableEventOf<T extends AnyChannelEvent> = T & {
  tick: number
  trackId: TrackId
}

export const convertTrackEvents = (
  events: readonly TrackEvent[],
  channel: number | undefined,
  trackId: TrackId,
) =>
  events
    .filter((e) => !(e.isRecording === true))
    .flatMap((e) => deassembleNote(e))
    .map(
      (e) =>
        ({
          ...e,
          channel,
          trackId,
        }) as CollectableEventOf<AnyChannelEvent>,
    )

export const collectAllEvents = (
  tracks: readonly Track[],
): CollectableEvent[] =>
  tracks.flatMap((t) => convertTrackEvents(t.events, t.channel, t.id))
