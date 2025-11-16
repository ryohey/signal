import { transaction } from "mobx"
import { ArrangePoint } from "../entities/transform/ArrangePoint"
import { isNotUndefined } from "../helpers/array"
import { SongStore } from "../stores/SongStore"

export class ArrangeCommandService {
  constructor(private readonly songStore: SongStore) {}

  // returns moved event ids
  moveEventsBetweenTracks = (
    eventIdForTrackIndex: { [trackIndex: number]: number[] },
    delta: ArrangePoint,
  ) => {
    const { tracks } = this.songStore.song
    return transaction(() => {
      const updates = []
      for (const [trackIndexStr, selectedEventIdsValue] of Object.entries(
        eventIdForTrackIndex,
      )) {
        const trackIndex = parseInt(trackIndexStr, 10)
        const track = tracks[trackIndex]
        const events = selectedEventIdsValue
          .map((id) => track.getEventById(id))
          .filter(isNotUndefined)

        if (delta.trackIndex === 0) {
          track.updateEvents(
            events.map((e) => ({
              id: e.id,
              tick: e.tick + delta.tick,
            })),
          )
        } else {
          updates.push({
            sourceTrackIndex: trackIndex,
            destinationTrackIndex: trackIndex + delta.trackIndex,
            events: events.map((e) => ({
              ...e,
              tick: e.tick + delta.tick,
            })),
          })
        }
      }
      if (delta.trackIndex !== 0) {
        const ids: { [trackIndex: number]: number[] } = {}
        for (const u of updates) {
          tracks[u.sourceTrackIndex].removeEvents(u.events.map((e) => e.id))
          const events = tracks[u.destinationTrackIndex].addEvents(u.events)
          ids[u.destinationTrackIndex] = events.map((e) => e.id)
        }
        return ids
      }

      return eventIdForTrackIndex
    })
  }
}
