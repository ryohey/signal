import { GLFallback, HitArea } from "@ryohey/webgl-react"
import React, { FC, useCallback, useMemo } from "react"
import { useNoteColor } from "../../../hooks/useNoteColor"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useSettings } from "../../../hooks/useSettings"
import { useTrack } from "../../../hooks/useTrack"
import { PianoNoteItem } from "../../../stores/PianoRollStore"
import { useAddNoteToSelectionGesture } from "../MouseHandler/gestures/useAddNoteToSelectionGesture"
import {
  useDragNoteCenterGesture,
  useDragNoteLeftGesture,
  useDragNoteRightGesture,
} from "../MouseHandler/gestures/useDragNoteEdgeGesture"
import { useRemoveNoteFromSelectionGesture } from "../MouseHandler/gestures/useRemoveNoteFromSelectionGesture"
import { useRemoveNoteGesture } from "../MouseHandler/gestures/useRemoveNoteGesture"
import { LegacyNotes } from "./lagacy/LegacyNotes"
import { NoteCircles } from "./NoteCircles"
import { NoteLabels } from "./NoteLabels"
import { NoteRectangles } from "./NoteRectangles"

export interface NotesProps {
  zIndex: number
}

export const Notes: FC<NotesProps> = (props) => {
  const { mouseMode } = usePianoRoll()

  return (
    <>
      <NotesContent {...props} />
      {mouseMode === "pencil" && <NoteHitAreas zIndex={props.zIndex} />}
    </>
  )
}

export const NotesContent: FC<NotesProps> = (props) => {
  return <GLFallback component={_Notes} fallback={LegacyNotes} {...props} />
}

const _Notes: FC<{ zIndex: number }> = ({ zIndex }) => {
  const { notes, selectedTrackId } = usePianoRoll()
  const { isRhythmTrack } = useTrack(selectedTrackId)
  const { borderColor, inactiveColor, activeColor, selectedColor } =
    useNoteColor()
  const { showNoteLabels } = useSettings()

  return (
    <>
      {isRhythmTrack && (
        <NoteCircles
          strokeColor={borderColor}
          rects={notes}
          inactiveColor={inactiveColor}
          activeColor={activeColor}
          selectedColor={selectedColor}
          zIndex={zIndex}
        />
      )}
      {!isRhythmTrack && (
        <>
          <NoteRectangles
            strokeColor={borderColor}
            inactiveColor={inactiveColor}
            activeColor={activeColor}
            selectedColor={selectedColor}
            rects={notes}
            zIndex={zIndex + 0.1}
          />
          {showNoteLabels && <NoteLabels rects={notes} zIndex={zIndex + 0.2} />}
        </>
      )}
    </>
  )
}

const NoteHitAreas = ({ zIndex }: { zIndex: number }) => {
  const { notes, selectedNoteIds } = usePianoRoll()
  const removeNoteGesture = useRemoveNoteGesture()
  const { selectedNoteIds, selectedTrackId } = usePianoRoll()
  const { removeEvent } = useTrack(selectedTrackId)
  const dragNoteCenterGesture = useDragNoteCenterGesture()
  const dragNoteLeftGesture = useDragNoteLeftGesture()
  const dragNoteRightGesture = useDragNoteRightGesture()
  const removeNoteFromSelectionGesture = useRemoveNoteFromSelectionGesture()
  const addNoteToSelectionGesture = useAddNoteToSelectionGesture()

  const onMouseDown = useCallback(
    (e: MouseEvent, item: PianoNoteItem, position: MousePositionType) => {
      e.stopPropagation()
      const isSelected = selectedNoteIds.includes(item.id)

      switch (e.button) {
        case 0: {
          if (e.shiftKey) {
            if (isSelected) {
              removeNoteFromSelectionGesture.onMouseDown(e, item.id)
            } else {
              addNoteToSelectionGesture.onMouseDown(e, item.id)
            }
          } else {
            switch (position) {
              case "center":
                return dragNoteCenterGesture.onMouseDown(e, item.id)
              case "left":
                return dragNoteLeftGesture.onMouseDown(e, item.id)
              case "right":
                return dragNoteRightGesture.onMouseDown(e, item.id)
            }
          }
          break
        }
        case 2:
          removeEvent(item.id)
          break
        default:
          return null
      }
    },
    [
      selectedNoteIds,
      removeEvent,
      dragNoteCenterGesture,
      dragNoteLeftGesture,
      dragNoteRightGesture,
      removeNoteFromSelectionGesture,
      addNoteToSelectionGesture,
    ],
  )

  const onMouseMove = useCallback(
    (e: MouseEvent, item: PianoNoteItem) => {
      // Right click to remove note while dragging
      if (e.buttons === 2) {
        e.stopPropagation()
        removeEvent(item.id)
      }
    },
    [removeEvent],
  )

  return (
    <>
      {notes.flatMap((note) => (
        <NoteHitArea
          key={note.id}
          note={note}
          zIndex={zIndex}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
        />
      ))}
    </>
  )
}

const NoteHitArea = React.memo(
  ({
    note,
    zIndex,
    onMouseDown,
    onMouseMove,
  }: {
    note: PianoNoteItem
    zIndex: number
    onMouseDown: (
      e: MouseEvent,
      item: PianoNoteItem,
      position: MousePositionType,
    ) => void
    onMouseMove?: (e: MouseEvent, item: PianoNoteItem) => void
  }) => {
    const edgeSize = Math.min(note.width / 3, 8)
    const leftEdgeBounds = useMemo(
      () => ({
        x: note.x,
        y: note.y,
        width: edgeSize,
        height: note.height,
      }),
      [note.x, note.y, note.height, edgeSize],
    )
    const rightEdgeBounds = useMemo(
      () => ({
        x: note.x + note.width - edgeSize,
        y: note.y,
        width: edgeSize,
        height: note.height,
      }),
      [note.x, note.y, note.width, note.height, edgeSize],
    )
    const centerBounds = useMemo(
      () => ({
        x: note.x + edgeSize,
        y: note.y,
        width: note.width - edgeSize * 2,
        height: note.height,
      }),
      [note.x, note.y, note.width, note.height, edgeSize],
    )
    const onMouseDownLeft = useCallback(
      (e: MouseEvent) => onMouseDown(e, note, "left"),
      [onMouseDown, note],
    )
    const onMouseDownCenter = useCallback(
      (e: MouseEvent) => onMouseDown(e, note, "center"),
      [onMouseDown, note],
    )
    const onMouseDownRight = useCallback(
      (e: MouseEvent) => onMouseDown(e, note, "right"),
      [onMouseDown, note],
    )
    const onMouseMoveAll = useCallback(
      (e: MouseEvent) => {
        onMouseMove?.(e, note)
      },
      [onMouseMove, note],
    )
    return (
      <>
        {/* left edge */}
        <HitArea
          key={note.id + "-left"}
          bounds={leftEdgeBounds}
          cursor="w-resize"
          zIndex={zIndex}
          onMouseDown={onMouseDownLeft}
          onMouseMove={onMouseMoveAll}
        />
        {/* center */}
        <HitArea
          key={note.id + "-center"}
          bounds={centerBounds}
          cursor="move"
          zIndex={zIndex}
          onMouseDown={onMouseDownCenter}
          onMouseMove={onMouseMoveAll}
        />
        {/* right edge */}
        <HitArea
          key={note.id + "-right"}
          bounds={rightEdgeBounds}
          cursor="e-resize"
          zIndex={zIndex}
          onMouseDown={onMouseDownRight}
          onMouseMove={onMouseMoveAll}
        />
      </>
    )
  },
)

type MousePositionType = "left" | "center" | "right"
