import { isNoteEvent, NoteEvent } from "@signal-app/core"
import { useCallback } from "react"
import { MaxNoteNumber } from "../Constants"
import { Selection } from "../entities/selection/Selection"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll, usePianoRollQuantizer } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { usePreviewNote } from "../hooks/usePreviewNote"
import { useTrack } from "../hooks/useTrack"
import { eventsInSelection, useSelectNote } from "./selection"

// Move keyboard cursor by ±1 quantize step (A/D keys)
export const useMoveCursor = () => {
  const { setCursorTick } = usePianoRoll()
  const { setPosition } = usePlayer()
  const { quantizeUnit } = usePianoRollQuantizer()

  return useCallback(
    (direction: 1 | -1) => {
      setCursorTick((prev: number) => {
        const next = Math.max(0, prev + direction * quantizeUnit)
        setPosition(next)
        return next
      })
    },
    [setCursorTick, setPosition, quantizeUnit],
  )
}

// Navigate to the nearest note at a different tick, choosing by pitch proximity (Left/Right)
export const useSelectNoteByProximity = () => {
  const {
    selectedTrackId,
    selectedNoteIds,
    setCursorTick,
    setLastNavigatedNoteNumber,
    lastNavigatedNoteNumber,
    cursorTick,
  } = usePianoRoll()
  const { getEvents } = useTrack(selectedTrackId)
  const { setPosition } = usePlayer()
  const selectNote = useSelectNote()
  const { previewNoteOn } = usePreviewNote()

  return useCallback(
    (direction: 1 | -1) => {
      const allNotes = getEvents().filter(isNoteEvent)
      if (allNotes.length === 0) return

      let referenceTick: number
      let referenceNoteNumber: number

      if (selectedNoteIds.length > 0) {
        const selectedNote = allNotes.find((n) => n.id === selectedNoteIds[0])
        if (!selectedNote) return
        referenceTick = selectedNote.tick
        referenceNoteNumber = lastNavigatedNoteNumber
      } else {
        referenceTick = cursorTick
        referenceNoteNumber = lastNavigatedNoteNumber
      }

      const uniqueTicks = [...new Set(allNotes.map((n) => n.tick))].sort(
        (a, b) => a - b,
      )

      let currentTickIndex = uniqueTicks.indexOf(referenceTick)
      if (currentTickIndex === -1) {
        if (direction === 1) {
          currentTickIndex = uniqueTicks.findIndex((t) => t > referenceTick)
          if (currentTickIndex === -1) return
          currentTickIndex -= 1
        } else {
          for (let i = uniqueTicks.length - 1; i >= 0; i--) {
            if (uniqueTicks[i] < referenceTick) {
              currentTickIndex = i + 1
              break
            }
          }
          if (currentTickIndex === -1) return
        }
      }

      const targetTickIndex = currentTickIndex + direction
      if (targetTickIndex < 0 || targetTickIndex >= uniqueTicks.length) return

      const targetTick = uniqueTicks[targetTickIndex]
      const notesAtTick = allNotes.filter((n) => n.tick === targetTick)

      let closest: NoteEvent | undefined
      let closestDistance = Infinity
      for (const note of notesAtTick) {
        const dist = Math.abs(note.noteNumber - referenceNoteNumber)
        if (dist < closestDistance) {
          closestDistance = dist
          closest = note
        }
      }

      if (!closest) return

      selectNote(closest.id)
      setLastNavigatedNoteNumber(closest.noteNumber)
      setCursorTick(closest.tick)
      setPosition(closest.tick)
      previewNoteOn(closest.noteNumber, closest.duration)
    },
    [
      selectedNoteIds,
      getEvents,
      selectNote,
      previewNoteOn,
      setCursorTick,
      setPosition,
      setLastNavigatedNoteNumber,
      lastNavigatedNoteNumber,
      cursorTick,
    ],
  )
}

// Cycle through notes at the same tick (Ctrl+Up/Ctrl+Down)
export const useCycleSameTickNote = () => {
  const {
    selectedTrackId,
    selectedNoteIds,
    setLastNavigatedNoteNumber,
    setCursorTick,
  } = usePianoRoll()
  const { getEvents } = useTrack(selectedTrackId)
  const { setPosition } = usePlayer()
  const selectNote = useSelectNote()
  const { previewNoteOn } = usePreviewNote()

  return useCallback(
    (direction: 1 | -1) => {
      if (selectedNoteIds.length === 0) return

      const allNotes = getEvents().filter(isNoteEvent)
      const currentNote = allNotes.find((n) => n.id === selectedNoteIds[0])
      if (!currentNote) return

      const notesAtSameTick = allNotes
        .filter((n) => n.tick === currentNote.tick)
        .sort((a, b) => a.noteNumber - b.noteNumber)

      if (notesAtSameTick.length <= 1) return

      const currentIndex = notesAtSameTick.findIndex(
        (n) => n.id === currentNote.id,
      )
      const nextIndex = currentIndex + direction
      if (nextIndex < 0 || nextIndex >= notesAtSameTick.length) return

      const nextNote = notesAtSameTick[nextIndex]
      selectNote(nextNote.id)
      setLastNavigatedNoteNumber(nextNote.noteNumber)
      setCursorTick(nextNote.tick)
      setPosition(nextNote.tick)
      previewNoteOn(nextNote.noteNumber, nextNote.duration)
    },
    [
      selectedNoteIds,
      getEvents,
      selectNote,
      previewNoteOn,
      setLastNavigatedNoteNumber,
      setCursorTick,
      setPosition,
    ],
  )
}

// Input a note by letter key (C/D/E/F/G/A/B)
// advance=true: move cursor forward by the note's duration after placing
// advance=false (Shift+letter): place note at cursor without advancing
export const useInputNoteByKey = () => {
  const {
    selectedTrackId,
    cursorTick,
    cursorNoteNumber,
    setCursorTick,
    setCursorNoteNumber,
    setLastNavigatedNoteNumber,
    setSelectedNoteIds,
    newNoteVelocity,
    lastNoteDuration,
  } = usePianoRoll()
  const { addEvent } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()
  const { quantizeUnit } = usePianoRollQuantizer()
  const { previewNoteOn } = usePreviewNote()
  const { setPosition } = usePlayer()

  const noteNameToSemitone: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }

  return useCallback(
    (noteName: string, advance: boolean = true) => {
      const semitone = noteNameToSemitone[noteName]
      if (semitone === undefined) return

      const octave = Math.floor(cursorNoteNumber / 12)
      const noteNumber = Math.min(127, Math.max(0, octave * 12 + semitone))

      pushHistory()

      const duration = lastNoteDuration ?? quantizeUnit
      const newEvent = addEvent({
        type: "channel",
        subtype: "note",
        tick: cursorTick,
        noteNumber,
        velocity: newNoteVelocity,
        duration,
      } as NoteEvent)

      if (newEvent) {
        setSelectedNoteIds([newEvent.id])
        setCursorNoteNumber(noteNumber)
        setLastNavigatedNoteNumber(noteNumber)
        previewNoteOn(noteNumber, duration)
      }

      if (advance) {
        // Advance cursor by the placed note's duration
        const nextTick = cursorTick + duration
        setCursorTick(nextTick)
        setPosition(nextTick)
      }
    },
    [
      cursorTick,
      cursorNoteNumber,
      newNoteVelocity,
      lastNoteDuration,
      quantizeUnit,
      pushHistory,
      addEvent,
      setSelectedNoteIds,
      setCursorTick,
      setCursorNoteNumber,
      setLastNavigatedNoteNumber,
      previewNoteOn,
      setPosition,
    ],
  )
}

// Change duration of selected notes (Shift+Left/Right when notes selected)
export const useChangeDuration = () => {
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const { getEventById, updateEvent } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()
  const { quantizeUnit } = usePianoRollQuantizer()

  return useCallback(
    (direction: 1 | -1) => {
      if (selectedNoteIds.length === 0) return

      const minDuration = Math.max(1, Math.floor(quantizeUnit / 4))
      pushHistory()

      for (const id of selectedNoteIds) {
        const event = getEventById(id)
        if (event && isNoteEvent(event)) {
          const newDuration = Math.max(
            minDuration,
            event.duration + direction * quantizeUnit,
          )
          updateEvent(id, { duration: newDuration })
        }
      }
    },
    [selectedNoteIds, getEventById, updateEvent, pushHistory, quantizeUnit],
  )
}

// Expand time selection when nothing is selected (Shift+Left/Right)
// Switches to the built-in selection tool and creates/grows a selection
export const useExpandSelection = () => {
  const {
    selectedTrackId,
    setCursorTick,
    cursorTick,
    setSelection,
    setSelectedNoteIds,
    setMouseMode,
    selectionAnchorTick,
    setSelectionAnchorTick,
  } = usePianoRoll()
  const { getEvents } = useTrack(selectedTrackId)
  const { quantizeUnit } = usePianoRollQuantizer()
  const { setPosition } = usePlayer()

  return useCallback(
    (direction: 1 | -1) => {
      // Switch to the selection tool so the selection rect renders
      setMouseMode("selection")

      let anchor = selectionAnchorTick
      if (anchor === null) {
        anchor = cursorTick
        setSelectionAnchorTick(anchor)
      }

      const newCursorTick = Math.max(0, cursorTick + direction * quantizeUnit)
      setCursorTick(newCursorTick)
      setPosition(newCursorTick)

      // Build selection using Selection.fromPoints (full pitch range)
      const selection = Selection.fromPoints(
        { tick: anchor, noteNumber: MaxNoteNumber },
        { tick: newCursorTick, noteNumber: 0 },
      )
      setSelection(selection)

      // Select notes within the selection range
      setSelectedNoteIds(
        eventsInSelection(getEvents(), selection).map((e) => e.id),
      )
    },
    [
      cursorTick,
      selectionAnchorTick,
      setCursorTick,
      setSelection,
      setSelectedNoteIds,
      setMouseMode,
      setSelectionAnchorTick,
      getEvents,
      quantizeUnit,
      setPosition,
    ],
  )
}

// Delete selected notes and auto-select the previous note (Delete/Backspace)
export const useDeleteAndSelectPrevious = () => {
  const {
    selectedTrackId,
    selectedNoteIds,
    setSelectedNoteIds,
    setSelection,
    setCursorTick,
    setLastNavigatedNoteNumber,
    lastNavigatedNoteNumber,
  } = usePianoRoll()
  const { getEvents, removeEvents } = useTrack(selectedTrackId)
  const { setPosition } = usePlayer()
  const { pushHistory } = useHistory()
  const selectNote = useSelectNote()
  const { previewNoteOn } = usePreviewNote()

  return useCallback(() => {
    if (selectedNoteIds.length === 0) return

    const allNotes = getEvents().filter(isNoteEvent)
    const selectedNote = allNotes.find((n) => n.id === selectedNoteIds[0])

    let prevNote: NoteEvent | undefined
    if (selectedNote) {
      const referenceTick = selectedNote.tick

      const uniqueTicks = [...new Set(allNotes.map((n) => n.tick))].sort(
        (a, b) => a - b,
      )
      const currentTickIndex = uniqueTicks.indexOf(referenceTick)

      if (currentTickIndex > 0) {
        const prevTick = uniqueTicks[currentTickIndex - 1]
        const notesAtPrevTick = allNotes
          .filter((n) => n.tick === prevTick)
          .filter((n) => !selectedNoteIds.includes(n.id))

        let closestDistance = Infinity
        for (const note of notesAtPrevTick) {
          const dist = Math.abs(note.noteNumber - lastNavigatedNoteNumber)
          if (dist < closestDistance) {
            closestDistance = dist
            prevNote = note
          }
        }
      }

      if (!prevNote) {
        const sameTickNotes = allNotes
          .filter((n) => n.tick === referenceTick)
          .filter((n) => !selectedNoteIds.includes(n.id))
        if (sameTickNotes.length > 0) {
          let closestDistance = Infinity
          for (const note of sameTickNotes) {
            const dist = Math.abs(note.noteNumber - lastNavigatedNoteNumber)
            if (dist < closestDistance) {
              closestDistance = dist
              prevNote = note
            }
          }
        }
      }
    }

    pushHistory()
    removeEvents(selectedNoteIds)
    setSelection(null)

    if (prevNote) {
      selectNote(prevNote.id)
      setLastNavigatedNoteNumber(prevNote.noteNumber)
      setCursorTick(prevNote.tick)
      setPosition(prevNote.tick)
      previewNoteOn(prevNote.noteNumber, prevNote.duration)
    } else {
      setSelectedNoteIds([])
    }
  }, [
    selectedNoteIds,
    getEvents,
    removeEvents,
    pushHistory,
    selectNote,
    previewNoteOn,
    setSelection,
    setSelectedNoteIds,
    setCursorTick,
    setPosition,
    setLastNavigatedNoteNumber,
    lastNavigatedNoteNumber,
  ])
}

// Go to the beginning of the piece (Ctrl+Left when nothing selected)
export const useGoToBeginning = () => {
  const { setCursorTick, setSelectionAnchorTick } = usePianoRoll()
  const { setPosition } = usePlayer()

  return useCallback(() => {
    setCursorTick(0)
    setPosition(0)
    setSelectionAnchorTick(null)
  }, [setCursorTick, setPosition, setSelectionAnchorTick])
}

// Jump to the last (most recent) note in the track (Ctrl+Right)
export const useGoToEnd = () => {
  const {
    selectedTrackId,
    setCursorTick,
    setLastNavigatedNoteNumber,
    setSelectionAnchorTick,
  } = usePianoRoll()
  const { getEvents } = useTrack(selectedTrackId)
  const { setPosition } = usePlayer()
  const selectNote = useSelectNote()
  const { previewNoteOn } = usePreviewNote()

  return useCallback(() => {
    const allNotes = getEvents().filter(isNoteEvent)
    if (allNotes.length === 0) return

    // Find the note with the highest tick (last note in the piece)
    let lastNote = allNotes[0]
    for (const note of allNotes) {
      if (note.tick > lastNote.tick) {
        lastNote = note
      }
    }

    selectNote(lastNote.id)
    setLastNavigatedNoteNumber(lastNote.noteNumber)
    setCursorTick(lastNote.tick)
    setPosition(lastNote.tick)
    setSelectionAnchorTick(null)
    previewNoteOn(lastNote.noteNumber, lastNote.duration)
  }, [
    getEvents,
    selectNote,
    previewNoteOn,
    setCursorTick,
    setPosition,
    setLastNavigatedNoteNumber,
    setSelectionAnchorTick,
  ])
}

// Move selected notes by ±1 quantize step (Alt+Left/Right)
export const useMoveSelectedNotes = () => {
  const { selectedTrackId, selectedNoteIds, setCursorTick } = usePianoRoll()
  const { getEventById, updateEvent } = useTrack(selectedTrackId)
  const { setPosition } = usePlayer()
  const { pushHistory } = useHistory()
  const { quantizeUnit } = usePianoRollQuantizer()

  return useCallback(
    (direction: 1 | -1) => {
      if (selectedNoteIds.length === 0) return

      pushHistory()

      const delta = direction * quantizeUnit

      for (const id of selectedNoteIds) {
        const event = getEventById(id)
        if (event && isNoteEvent(event)) {
          const newTick = Math.max(0, event.tick + delta)
          updateEvent(id, { tick: newTick })
        }
      }

      setCursorTick((prev: number) => {
        const next = Math.max(0, prev + delta)
        setPosition(next)
        return next
      })
    },
    [
      selectedNoteIds,
      getEventById,
      updateEvent,
      pushHistory,
      quantizeUnit,
      setCursorTick,
      setPosition,
    ],
  )
}

// Snap cursor to quantized floor (called on playback stop)
export const useSnapCursorToQuantize = () => {
  const { setCursorTick } = usePianoRoll()
  const { setPosition } = usePlayer()
  const { quantizeFloor } = usePianoRollQuantizer()

  return useCallback(() => {
    setCursorTick((prev: number) => {
      const snapped = quantizeFloor(prev)
      setPosition(snapped)
      return snapped
    })
  }, [setCursorTick, setPosition, quantizeFloor])
}
