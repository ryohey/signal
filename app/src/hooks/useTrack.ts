import { useCallback } from "react"
import { TrackId } from "../track"
import { TrackColor } from "../track/TrackColor"
import { TrackEvent } from "../track/TrackEvent"
import { useMobxSelector } from "./useMobxSelector"
import { useSong } from "./useSong"

export function useTrack(id: TrackId) {
  const song = useSong()
  const track = useMobxSelector(() => song.getTrack(id), [song, id])

  return {
    get isRhythmTrack() {
      return useMobxSelector(() => track?.isRhythmTrack ?? false, [track])
    },
    get isConductorTrack() {
      return useMobxSelector(() => track?.isConductorTrack ?? false, [track])
    },
    get programNumber() {
      return useMobxSelector(() => track?.programNumber ?? 0, [track])
    },
    get name() {
      return useMobxSelector(() => track?.name ?? "", [track])
    },
    get channel() {
      return useMobxSelector(() => track?.channel ?? 0, [track])
    },
    get events() {
      return useMobxSelector(() => track?.events ?? [], [track])
    },
    getEvents() {
      return track?.events ?? []
    },
    get color() {
      return useMobxSelector(() => track?.color, [track])
    },
    setColor: useCallback(
      (color: TrackColor | null) => {
        track?.setColor(color)
      },
      [track],
    ),
    setName: useCallback(
      (name: string) => {
        track?.setName(name)
      },
      [track],
    ),
    setChannel: useCallback(
      (channel: number | undefined) => {
        if (track) {
          track.channel = channel
        }
      },
      [track],
    ),
    addEvent: useCallback(
      <T extends TrackEvent>(
        event: Omit<T, "id"> & { subtype?: string },
      ): T | undefined => {
        if (track) {
          return track.addEvent(event)
        }
        return undefined
      },
      [track],
    ),
    addEvents: useCallback(
      <T extends TrackEvent>(events: Omit<T, "id">[]) => {
        if (track) {
          return track.addEvents(events)
        }
      },
      [track],
    ),
    removeEvent: useCallback(
      (eventId: number) => {
        if (track) {
          track.removeEvent(eventId)
        }
      },
      [track],
    ),
    removeEvents: useCallback(
      (eventIds: number[]) => {
        if (track) {
          track.removeEvents(eventIds)
        }
      },
      [track],
    ),
    removeRedundantEvents: useCallback(
      (event: TrackEvent) => {
        if (track) {
          track.removeRedundantEvents(event)
        }
      },
      [track],
    ),
    createOrUpdate: useCallback(
      <T extends TrackEvent>(
        newEvent: Omit<T, "id"> & { subtype?: string; controllerType?: number },
      ) => {
        if (track) {
          return track.createOrUpdate(newEvent)
        }
      },
      [track],
    ),
    updateEvent: useCallback(
      (eventId: number, event: Partial<TrackEvent>) => {
        if (track) {
          return track.updateEvent(eventId, event)
        }
        return null
      },
      [track],
    ),
    updateEvents: useCallback(
      (events: Partial<TrackEvent>[]) => {
        if (track) {
          track.updateEvents(events)
        }
      },
      [track],
    ),
    getEventById: useCallback(
      (eventId: number) => {
        return track?.getEventById(eventId)
      },
      [track],
    ),
  }
}
