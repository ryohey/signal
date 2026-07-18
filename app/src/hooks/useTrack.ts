import {
  getProgramNumberEvent,
  Track,
  TrackColor,
  TrackEvent,
  TrackId,
} from "@signal-app/core"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { TrackMute } from "../trackMute/TrackMute"
import { usePlayer } from "./usePlayer"
import { useSong } from "./useSong"
import { useTrackMute } from "./useTrackMute"

const noop = () => () => {}
const emptyArray: never[] = []

export function useTrack(id: TrackId) {
  const { tracks } = useSong()
  const track = useMemo(() => tracks.find((t) => t.id === id), [tracks, id])

  return {
    get isRhythmTrack() {
      return useSyncExternalStore(
        track?.onIsRhythmTrackChanged.subscribe ?? noop,
        useCallback(() => track?.isRhythmTrack ?? false, [track]),
      )
    },
    get isConductorTrack() {
      return useSyncExternalStore(
        track?.onIsConductorTrackChanged.subscribe ?? noop,
        useCallback(() => track?.isConductorTrack ?? false, [track]),
      )
    },
    get programNumber() {
      const { position } = usePlayer()
      return useSyncExternalStore(
        track?.onProgramChangeEventsChanged.subscribe ?? noop,
        useCallback(
          () =>
            getProgramNumberEvent(position)(track?.events ?? [])?.value ?? 0,
          [track, position],
        ),
      )
    },
    get name() {
      return useSyncExternalStore(
        track?.onNameChanged.subscribe ?? noop,
        useCallback(() => track?.name, [track]),
      )
    },
    get channel() {
      return useSyncExternalStore(
        track?.onChannelChanged.subscribe ?? noop,
        useCallback(() => track?.channel, [track]),
      )
    },
    get events() {
      return useSyncExternalStore(
        track?.onEventsChanged.subscribe ?? noop,
        useCallback(() => track?.getEventsSnapshot() ?? emptyArray, [track]),
      )
    },
    getEvents() {
      return track?.events ?? emptyArray
    },
    get color() {
      return useSyncExternalStore(
        track?.onColorChanged.subscribe ?? noop,
        useCallback(() => track?.color, [track]),
      )
    },
    get isMuted() {
      const { trackMute } = useTrackMute()
      const isMuted = TrackMute.isMuted(id)(trackMute)
      return isMuted
    },
    get isSolo() {
      const { trackMute } = useTrackMute()
      const isSolo = TrackMute.isSolo(id)(trackMute)
      return isSolo
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
    ...useTrackEvents(track),
  }
}

export function useTrackEvents(track: Track | undefined) {
  return {
    removeEvent: useCallback(
      (eventId: number) => {
        if (track) {
          track.removeEvent(eventId)
        }
      },
      [track],
    ),
    removeEvents: useCallback(
      (eventIds: readonly number[]) => {
        if (track) {
          track.removeEvents(eventIds)
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
      <T extends TrackEvent>(id: number, obj: Partial<T>): T | null => {
        if (track) {
          return track.updateEvent(id, obj)
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
  }
}
