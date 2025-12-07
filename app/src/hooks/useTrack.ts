import type { Track, TrackColor, TrackEvent, TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { TrackMute } from "../trackMute/TrackMute"
import { useMobxGetter, useMobxSelector } from "./useMobxSelector"
import { useSong } from "./useSong"
import { useTrackMute } from "./useTrackMute"

export function useTrack(id: TrackId) {
  const song = useSong()
  const track = useMobxSelector(() => song.getTrack(id), [song, id])

  return {
    get isRhythmTrack() {
      return useMobxGetter(track, "isRhythmTrack") ?? false
    },
    get isConductorTrack() {
      return useMobxGetter(track, "isConductorTrack") ?? false
    },
    get programNumber() {
      return useMobxGetter(track, "programNumber") ?? 0
    },
    get name() {
      return useMobxGetter(track, "name") ?? ""
    },
    get channel() {
      return useMobxGetter(track, "channel")
    },
    get events() {
      return useMobxGetter(track, "events") ?? []
    },
    getEvents() {
      return track?.events ?? []
    },
    get color() {
      return useMobxGetter(track, "color")
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
      [track]
    ),
    setName: useCallback(
      (name: string) => {
        track?.setName(name)
      },
      [track]
    ),
    setChannel: useCallback(
      (channel: number | undefined) => {
        if (track) {
          track.channel = channel
        }
      },
      [track]
    ),
    setPan: useCallback(
      (pan: number, tick: number) => {
        track?.setPan(pan, tick)
      },
      [track]
    ),
    setVolume: useCallback(
      (volume: number, tick: number) => {
        track?.setVolume(volume, tick)
      },
      [track]
    ),
    setProgramNumber: useCallback(
      (programNumber: number) => {
        track?.setProgramNumber(programNumber)
      },
      [track]
    ),
    ...useTrackEvents(track),
  }
}

export function useTrackEvents(track: Track | undefined) {
  return {
    addEvent: useCallback(
      <T extends TrackEvent>(
        event: Omit<T, "id"> & { subtype?: string }
      ): T | undefined => {
        if (track) {
          return track.addEvent(event)
        }
        return undefined
      },
      [track]
    ),
    addEvents: useCallback(
      <T extends TrackEvent>(events: Omit<T, "id">[]) => {
        if (track) {
          return track.addEvents(events)
        }
      },
      [track]
    ),
    removeEvent: useCallback(
      (eventId: number) => {
        if (track) {
          track.removeEvent(eventId)
        }
      },
      [track]
    ),
    removeEvents: useCallback(
      (eventIds: number[]) => {
        if (track) {
          track.removeEvents(eventIds)
        }
      },
      [track]
    ),
    createOrUpdate: useCallback(
      <T extends TrackEvent>(
        newEvent: Omit<T, "id"> & { subtype?: string; controllerType?: number }
      ) => {
        if (track) {
          return track.createOrUpdate(newEvent)
        }
      },
      [track]
    ),
    updateEvent: useCallback(
      <T extends TrackEvent>(id: number, obj: Partial<T>): T | null => {
        if (track) {
          return track.updateEvent(id, obj)
        }
        return null
      },
      [track]
    ),
    updateEvents: useCallback(
      (events: Partial<TrackEvent>[]) => {
        if (track) {
          track.updateEvents(events)
        }
      },
      [track]
    ),
    getEventById: useCallback(
      (eventId: number) => {
        return track?.getEventById(eventId)
      },
      [track]
    ),
  }
}
