import {
  deassemble as deassembleNote,
  Track,
  TrackEvent,
  TrackId,
} from "@signal-app/core"
import { PlayerEvent, PlayerEventOf } from "@signal-app/player"
import { AnyChannelEvent } from "midifile-ts"

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
        }) as PlayerEventOf<AnyChannelEvent>,
    )

export const collectAllEvents = (tracks: readonly Track[]): PlayerEvent[] =>
  tracks.flatMap((t) => convertTrackEvents(t.events, t.channel, t.id))
