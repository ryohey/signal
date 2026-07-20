import {
  emptyTrack,
  isPanEvent,
  NoteEvent,
  TrackEvent,
  TrackEventOf,
} from "@signal-app/core"
import { act, renderHook } from "@testing-library/react"
import { ControllerEvent } from "midifile-ts"
import { describe, expect, it, vi } from "vitest"
import { useSyncTrackQueryInternal } from "./useSyncTrackQuery"

describe("useSyncTrackQueryInternal", () => {
  it("returns initial query result", () => {
    const track = emptyTrack(0)

    const { result } = renderHook(() =>
      useSyncTrackQueryInternal(
        track,
        (events) => events.filter(isPanEvent).length,
        isPanEvent,
      ),
    )

    expect(result.current).toBe(1)
  })

  it("updates only when predicate-matching events change", () => {
    const track = emptyTrack(0)
    const query = vi.fn(
      (events: readonly TrackEvent[]) => events.filter(isPanEvent).length,
    )

    const { result } = renderHook(() =>
      useSyncTrackQueryInternal(track, query, isPanEvent),
    )

    expect(result.current).toBe(1)
    expect(query).toHaveBeenCalledTimes(1)

    act(() => {
      track.addEvent<NoteEvent>({
        type: "channel",
        subtype: "note",
        tick: 0,
        duration: 120,
        velocity: 100,
        noteNumber: 60,
      })
    })

    expect(result.current).toBe(1)
    expect(query).toHaveBeenCalledTimes(1)

    act(() => {
      track.addEvent<TrackEventOf<ControllerEvent>>({
        type: "channel",
        subtype: "controller",
        tick: 10,
        controllerType: 10,
        value: 80,
      })
    })

    expect(result.current).toBe(2)
    expect(query).toHaveBeenCalledTimes(2)
  })

  it("falls back to empty events when track is undefined", () => {
    const query = vi.fn((events: readonly unknown[]) => events.length)

    const { result } = renderHook(() =>
      useSyncTrackQueryInternal(undefined, query, isPanEvent),
    )

    expect(result.current).toBe(0)
    expect(query).toHaveBeenCalledTimes(1)
  })
})
