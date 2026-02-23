import { isNoteEvent, NoteEvent } from "@signal-app/core"
import { useCallback } from "react"
import { Selection } from "../entities/selection/Selection"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll, usePianoRollQuantizer } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { usePreviewNote } from "../hooks/usePreviewNote"
import { useTrack } from "../hooks/useTrack"
import { useSelectNote } from "./selection"

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
        // Nothing selected: find note nearest to cursor
        referenceTick = cursorTick
        referenceNoteNumber = lastNavigatedNoteNumber
      }

      // Get all unique ticks
      const uniqueTicks = [...new Set(allNotes.map((n) => n.tick))].sort(
        (a, b) => a - b,
      )

      // Find the current tick index
      let currentTickIndex = uniqueTicks.indexOf(referenceTick)
      if (currentTickIndex === -1) {
        // If cursor isn't on an exact tick, find the nearest one in the direction
        if (direction === 1) {
          currentTickIndex = uniqueTicks.findIndex((t) => t > referenceTick)
          if (currentTickIndex === -1) return
          currentTickIndex -= 1 // Will be incremented below
        } else {
          for (let i = uniqueTicks.length - 1; i >= 0; i--) {
            if (uniqueTicks[i] < referenceTick) {
              currentTickIndex = i + 1 // Will be decremented below
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

      // Pick the note closest in pitch to the reference
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
      previewNoteOn(closest.noteNumber, closest.duration)
    },
    [
      selectedNoteIds,
      getEvents,
      selectNote,
      previewNoteOn,
      setCursorTick,
      setLastNavigatedNoteNumber,
      lastNavigatedNoteNumber,
      cursorTick,
    ],
  )
}

// Cycle through notes at the same tick (Ctrl+Up/Ctrl+Down)
export const useCycleSameTickNote = () => {
  const { selectedTrackId, selectedNoteIds, setLastNavigatedNoteNumber } =
    usePianoRoll()
  const { getEvents } = useTrack(selectedTrackId)
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
      previewNoteOn(nextNote.noteNumber, nextNote.duration)
    },
    [
      selectedNoteIds,
      getEvents,
      selectNote,
      previewNoteOn,
      setLastNavigatedNoteNumber,
    ],
  )
}

// Input a note by letter key (C/D/E/F/G/A/B)
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
    (noteName: string) => {
      const semitone = noteNameToSemitone[noteName]
      if (semitone === undefined) return

      // Derive octave from cursorNoteNumber
      const octave = Math.floor(cursorNoteNumber / 12)
      const noteNumber = Math.min(127, Math.max(0, octave * 12 + semitone))

      pushHistory()

      const duration = quantizeUnit
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

      // Advance cursor by quantize step
      const nextTick = cursorTick + quantizeUnit
      setCursorTick(nextTick)
      setPosition(nextTick)
    },
    [
      cursorTick,
      cursorNoteNumber,
      newNoteVelocity,
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
export const useExpandSelection = () => {
  const {
    setCursorTick,
    cursorTick,
    setSelection,
    selectionAnchorTick,
    setSelectionAnchorTick,
  } = usePianoRoll()
  const { quantizeUnit } = usePianoRollQuantizer()
  const { setPosition } = usePlayer()

  return useCallback(
    (direction: 1 | -1) => {
      let anchor = selectionAnchorTick
      if (anchor === null) {
        anchor = cursorTick
        setSelectionAnchorTick(anchor)
      }

      const newCursorTick = Math.max(0, cursorTick + direction * quantizeUnit)
      setCursorTick(newCursorTick)
      setPosition(newCursorTick)

      const fromTick = Math.min(anchor, newCursorTick)
      const toTick = Math.max(anchor, newCursorTick)

      setSelection({
        fromTick,
        toTick,
        fromNoteNumber: 128,
        toNoteNumber: 0,
      } as Selection)
    },
    [
      cursorTick,
      selectionAnchorTick,
      setCursorTick,
      setSelection,
      setSelectionAnchorTick,
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
  const { pushHistory } = useHistory()
  const selectNote = useSelectNote()
  const { previewNoteOn } = usePreviewNote()

  return useCallback(() => {
    if (selectedNoteIds.length === 0) return

    const allNotes = getEvents().filter(isNoteEvent)
    const selectedNote = allNotes.find((n) => n.id === selectedNoteIds[0])

    // Find the previous note by proximity before deleting
    let prevNote: NoteEvent | undefined
    if (selectedNote) {
      const referenceTick = selectedNote.tick

      // Get all unique ticks
      const uniqueTicks = [...new Set(allNotes.map((n) => n.tick))].sort(
        (a, b) => a - b,
      )
      const currentTickIndex = uniqueTicks.indexOf(referenceTick)

      if (currentTickIndex > 0) {
        const prevTick = uniqueTicks[currentTickIndex - 1]
        const notesAtPrevTick = allNotes
          .filter((n) => n.tick === prevTick)
          .filter((n) => !selectedNoteIds.includes(n.id))

        // Pick closest in pitch
        let closestDistance = Infinity
        for (const note of notesAtPrevTick) {
          const dist = Math.abs(note.noteNumber - lastNavigatedNoteNumber)
          if (dist < closestDistance) {
            closestDistance = dist
            prevNote = note
          }
        }
      }

      // If no note at a previous tick, try notes at the same tick that aren't selected
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
    setLastNavigatedNoteNumber,
    lastNavigatedNoteNumber,
  ])
}
