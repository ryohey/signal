import {
    isBankLSBEvent,
    isBankMSBEvent,
    isProgramChangeEvent,
    type Patch,
    type TrackColor,
    type TrackEvent,
    type TrackId
} from "@signal-app/core";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { TrackMute } from "../trackMute/TrackMute";
import { usePlayer } from "./usePlayer";
import { useSong } from "./useSong";
import { useTrackMute } from "./useTrackMute";

const noop = () => () => {}

/**
 * The patch of the last program change at or before the tick.
 */
export function usePatchAt(id: TrackId, tick: number) {
  const { getTrack } = useSong()
  const track = getTrack(id)
  // useSyncExternalStore compares snapshots by identity, so the patch is
  // packed into one number (each value is 7 bits) instead of a new object.
  const packed = useSyncExternalStore(
    useCallback(
      (listener: () => void) =>
        track?.subscribeEventsChanged(
          (e) =>
            isProgramChangeEvent(e) || isBankMSBEvent(e) || isBankLSBEvent(e),
          listener,
        ) ?? noop,
      [track],
    ),
    useCallback(() => {
      const patch = track?.getPatch(tick)
      return patch === undefined
        ? 0
        : patch.programNumber | (patch.bankMSB << 7) | (patch.bankLSB << 14)
    }, [track, tick]),
  )
  return useMemo<Patch>(
    () => ({
      programNumber: packed & 0x7f,
      bankMSB: (packed >> 7) & 0x7f,
      bankLSB: (packed >> 14) & 0x7f,
    }),
    [packed],
  )
}

export function useTrack(id: TrackId) {
  const { getTrack } = useSong()
  const track = getTrack(id)

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
      const subscribe = useCallback(
        (listener: () => void) =>
          track?.subscribeEventsChanged(isProgramChangeEvent, listener) ?? noop,
        [track],
      )
      const getSnapshot = useCallback(
        () => track?.getProgramChangeEvent(position)?.value ?? 0,
        [position, track],
      )
      return useSyncExternalStore(subscribe, getSnapshot)
    },
    get patch() {
      const { position } = usePlayer()
      return usePatchAt(id, position)
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
    updateEvent: useCallback(
      <T extends TrackEvent>(id: number, obj: Partial<T>) => {
        track?.updateEvent(id, obj)
      },
      [track],
    ),
    removeEvent: useCallback(
      (id: number) => {
        track?.removeEvent(id)
      },
      [track],
    ),
    removeEvents: useCallback(
      (ids: readonly number[]) => {
        track?.removeEvents(ids)
      },
      [track],
    ),
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
    setPatchAt: useCallback(
      (tick: number, patch: Patch) => {
        return track?.setPatchAt(tick, patch)
      },
      [track],
    ),
    insertPatchAt: useCallback(
      (tick: number, patch: Patch) => {
        return track?.insertPatchAt(tick, patch)
      },
      [track],
    ),
    setPatchById: useCallback(
      (eventId: number, patch: Patch) => {
        return track?.setPatchById(eventId, patch)
      },
      [track],
    ),
    getBankSelectIds: useCallback(
      (eventId: number) => track?.getBankSelectIds(eventId) ?? [],
      [track],
    ),
    dragProgramChange: useCallback(
      (eventId: number, bankSelectIds: readonly number[], tick: number) =>
        track?.dragProgramChange(eventId, bankSelectIds, tick) ?? false,
      [track],
    ),
    moveProgramChange: useCallback(
      (
        eventId: number,
        bankSelectIds: readonly number[],
        fromTick: number,
        toTick: number,
      ) => {
        track?.moveProgramChange(eventId, bankSelectIds, fromTick, toTick)
      },
      [track],
    ),
    removeProgramChange: useCallback(
      (eventId: number) => {
        track?.removeProgramChange(eventId)
      },
      [track],
    ),
    hasProgramChangeEventAfter: useCallback(
      (tick: number) => {
        return track?.hasProgramChangeEventAfter(tick) ?? false
      },
      [track],
    ),
    setPan: useCallback(
      (pan: number, tick: number) => {
        track?.setPan(pan, tick)
      },
      [track],
    ),
    setVolume: useCallback(
      (volume: number, tick: number) => {
        track?.setVolume(volume, tick)
      },
      [track],
    ),
  }
}
