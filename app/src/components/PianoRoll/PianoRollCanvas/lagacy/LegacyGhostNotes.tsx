import { useTheme } from "@emotion/react"
import Color from "color"
import { observer } from "mobx-react-lite"
import { FC, useMemo } from "react"
import { Range } from "../../../../entities/geometry/Range"
import { colorToVec4 } from "../../../../gl/color"
import { isEventOverlapRange } from "../../../../helpers/filterEvents"
import { useStores } from "../../../../hooks/useStores"
import { PianoNoteItem } from "../../../../stores/PianoRollStore"
import { isNoteEvent, TrackId } from "../../../../track"
import { trackColorToCSSColor } from "../../../../track/TrackColor"
import { NoteCircles } from "./NoteCircles"
import { NoteRectangles } from "./NoteRectangles"

export const LegacyGhostNotes: FC<{ zIndex: number; trackId: TrackId }> =
  observer(({ zIndex, trackId }) => {
    const {
      song,
      pianoRollStore: { scrollLeft, canvasWidth, transform },
    } = useStores()
    const theme = useTheme()
    const track = song.getTrack(trackId)

    if (track === undefined) {
      return <></>
    }

    const windowedEvents = useMemo(
      () =>
        track.events
          .filter(isNoteEvent)
          .filter(
            isEventOverlapRange(
              Range.fromLength(
                transform.getTick(scrollLeft),
                transform.getTick(canvasWidth),
              ),
            ),
          ),
      [scrollLeft, canvasWidth, transform.horizontalId, track.events],
    )

    const notes = useMemo(
      () =>
        windowedEvents.filter(isNoteEvent).map((e) => {
          const rect = track.isRhythmTrack
            ? transform.getDrumRect(e)
            : transform.getRect(e)
          return {
            ...rect,
            id: e.id,
            velocity: 127, // draw opaque when ghost
            isSelected: false,
          }
        }),
      [windowedEvents, transform, track.isRhythmTrack],
    )

    const getColorForTrackId = () => {
      const color = song.getTrack(trackId)?.color
      return colorToVec4(
        Color(
          color !== undefined
            ? trackColorToCSSColor(color)
            : theme.ghostNoteColor,
        ).mix(Color(theme.backgroundColor), 0.7),
      )
    }
    const borderColor = Color("transparent")
    const color = getColorForTrackId()

    const colorize = (item: PianoNoteItem) => ({
      ...item,
      color,
    })

    if (track.isRhythmTrack) {
      return (
        <NoteCircles
          strokeColor={colorToVec4(borderColor)}
          rects={notes.map(colorize)}
          zIndex={zIndex}
        />
      )
    }

    return (
      <NoteRectangles
        strokeColor={colorToVec4(borderColor)}
        rects={notes.map(colorize)}
        zIndex={zIndex + 0.1}
      />
    )
  })
