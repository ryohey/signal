import { isNoteEvent, NoteEvent, TrackId } from "@signal-app/core"
import { useEffect, useMemo, useState } from "react"
import { useSong } from "../../../hooks/useSong"
import { useArrangeNoteTransform } from "./useArrangeNoteTransform"
import { useArrangeTransform } from "./useArrangeTransform"

const NOTE_RECT_HEIGHT = 1

interface ArrangeNote {
  tick: number
  duration: number
  event: NoteEvent
  trackId: TrackId
  trackIndex: number
}

export function useArrangeNotes() {
  const { trackTransform } = useArrangeTransform()
  const { transform } = useArrangeNoteTransform()
  const { tracks } = useSong()
  const [events, setEvents] = useState<readonly ArrangeNote[]>([])

  useEffect(() => {
    const onChange = () => {
      setEvents(
        tracks.flatMap((track, index) =>
          track.events.filter(isNoteEvent).map((event) => ({
            tick: event.tick,
            duration: event.duration,
            event,
            trackId: track.id,
            trackIndex: index,
          })),
        ),
      )
    }
    const unsubscribes = tracks.map((track) =>
      track.onEventsChanged.subscribe(onChange),
    )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [tracks])

  return useMemo(
    () =>
      events.map((e) => {
        const rect = transform.getRect(e.event)
        return {
          ...rect,
          height: NOTE_RECT_HEIGHT,
          y: trackTransform.getY(e.trackIndex) + rect.y,
        }
      }),
    [events, transform, trackTransform],
  )
}
