import {
  getProgramNumberEvent,
  isProgramChangeEvent,
  selectorToQuery,
  TrackColor,
  TrackId,
} from "@signal-app/core"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { TrackMute } from "../trackMute/TrackMute"
import { usePlayer } from "./usePlayer"
import { useSong } from "./useSong"
import { useSyncTrackQuery } from "./useSyncTrackQuery"
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
      const query = useMemo(
        () => selectorToQuery(getProgramNumberEvent(position)),
        [position],
      )
      return useSyncTrackQuery(id, query, isProgramChangeEvent)?.value ?? 0
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
  }
}
