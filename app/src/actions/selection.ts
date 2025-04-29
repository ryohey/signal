import { max, min } from "lodash"
import { useCallback } from "react"
import {
  PianoNotesClipboardData,
  isPianoNotesClipboardData,
} from "../clipboard/clipboardTypes"
import { Rect } from "../entities/geometry/Rect"
import { Selection } from "../entities/selection/Selection"
import { isNotUndefined } from "../helpers/array"
import { tickToMillisec } from "../helpers/bpm"
import { useControlPane } from "../hooks/useControlPane"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import clipboard from "../services/Clipboard"
import { NoteEvent, TrackEvent, isNoteEvent } from "../track"
import { useStartNote, useStopNote } from "./player"

export function eventsInSelection(
  events: readonly TrackEvent[],
  selection: Selection,
) {
  const selectionRect = {
    x: selection.fromTick,
    width: selection.toTick - selection.fromTick,
    y: selection.toNoteNumber,
    height: selection.fromNoteNumber - selection.toNoteNumber,
  }
  return events.filter(isNoteEvent).filter((b) =>
    Rect.intersects(
      {
        x: b.tick,
        width: b.duration,
        y: b.noteNumber - 1, // Subtract 1 since the pitch is the lower end of the rectangle
        height: 1,
      },
      selectionRect,
    ),
  )
}

export const useTransposeSelection = () => {
  const song = useSong()
  const { selectedTrackIndex, selection, selectedNoteIds, setSelection } =
    usePianoRoll()
  const { pushHistory } = useHistory()

  return (deltaPitch: number) => {
    pushHistory()

    if (selection !== null) {
      const s = Selection.moved(selection, 0, deltaPitch)
      setSelection(s)
    }

    song.transposeNotes(deltaPitch, {
      [selectedTrackIndex]: selectedNoteIds,
    })
  }
}

export const useCloneSelection = () => {
  const { selection, selectedNoteIds, selectedTrack, setSelectedNoteIds } =
    usePianoRoll()
  return () => {
    if (selectedTrack === undefined || selection === null) {
      return
    }

    // 選択範囲内のノートをコピーした選択範囲を作成
    // Create a selection that copies notes within selection
    const notes = selectedNoteIds
      .map((id) => selectedTrack.getEventById(id))
      .filter(isNotUndefined)
      .map((note) => ({
        ...note, // copy
      }))
    selectedTrack.addEvents(notes)
    setSelectedNoteIds(notes.map((e) => e.id))
  }
}

export const useCopySelection = () => {
  const { selection, selectedNoteIds, selectedTrack } = usePianoRoll()
  return () => {
    if (selectedTrack === undefined || selectedNoteIds.length === 0) {
      return
    }

    const selectedNotes = selectedNoteIds
      .map((id) => selectedTrack.getEventById(id))
      .filter(isNotUndefined)
      .filter(isNoteEvent)

    const startTick =
      selection?.fromTick ?? min(selectedNotes.map((note) => note.tick))!

    // 選択されたノートをコピー
    // Copy selected note
    const notes = selectedNotes.map((note) => ({
      ...note,
      tick: note.tick - startTick, // 選択範囲からの相対位置にする
    }))

    const data: PianoNotesClipboardData = {
      type: "piano_notes",
      notes,
    }

    clipboard.writeText(JSON.stringify(data))
  }
}

export const useDeleteSelection = () => {
  const {
    selection,
    selectedNoteIds,
    selectedTrack,
    setSelection,
    setSelectedNoteIds,
  } = usePianoRoll()
  const { pushHistory } = useHistory()

  return () => {
    if (
      selectedTrack === undefined ||
      (selectedNoteIds.length === 0 && selection === null)
    ) {
      return
    }

    pushHistory()

    // 選択範囲と選択されたノートを削除
    // Remove selected notes and selected notes
    selectedTrack.removeEvents(selectedNoteIds)
    setSelection(null)
    setSelectedNoteIds([])
  }
}

export const usePasteSelection = () => {
  const { selectedTrack } = usePianoRoll()
  const { position } = usePlayer()
  const { pushHistory } = useHistory()

  return () => {
    if (selectedTrack === undefined) {
      return
    }
    // Paste notes copied to the current position
    const text = clipboard.readText()
    if (!text || text.length === 0) {
      return
    }
    const obj = JSON.parse(text)
    if (!isPianoNotesClipboardData(obj)) {
      return
    }

    pushHistory()

    const notes = obj.notes.map((note) => ({
      ...note,
      tick: Math.max(0, note.tick + position),
    }))
    selectedTrack.addEvents(notes)
  }
}

export const useDuplicateSelection = () => {
  const {
    selection,
    selectedNoteIds,
    selectedTrack,
    setSelection,
    setSelectedNoteIds,
  } = usePianoRoll()
  const { pushHistory } = useHistory()

  return () => {
    if (
      selectedTrack === undefined ||
      selection === null ||
      selectedNoteIds.length === 0
    ) {
      return
    }

    pushHistory()

    // move to the end of selection
    let deltaTick = selection.toTick - selection.fromTick

    const selectedNotes = selectedNoteIds
      .map((id) => selectedTrack.getEventById(id))
      .filter(isNotUndefined)
      .filter(isNoteEvent)

    if (deltaTick === 0) {
      const left = min(selectedNotes.map((n) => n.tick)) ?? 0
      const right = max(selectedNotes.map((n) => n.tick + n.duration)) ?? 0
      deltaTick = right - left
    }

    const notes = selectedNotes.map((note) => ({
      ...note,
      tick: note.tick + deltaTick,
    }))

    // select the created notes
    const addedNotes = selectedTrack.addEvents(notes)
    setSelection(Selection.moved(selection, deltaTick, 0))
    setSelectedNoteIds(addedNotes.map((n) => n.id))
  }
}

export const useSelectNote = () => {
  const { selectedTrack, setSelectedNoteIds } = usePianoRoll()
  const { setSelectedEventIds } = useControlPane()

  return (noteId: number) => {
    if (selectedTrack === undefined) {
      return
    }
    setSelectedEventIds([])
    setSelectedNoteIds([noteId])
  }
}

const sortedNotes = (notes: NoteEvent[]): NoteEvent[] =>
  notes.filter(isNoteEvent).sort((a, b) => {
    if (a.tick < b.tick) return -1
    if (a.tick > b.tick) return 1
    if (a.noteNumber < b.noteNumber) return -1
    if (a.noteNumber > b.noteNumber) return 1
    return 0
  })

const useSelectNeighborNote = () => {
  const { selectedTrack, selectedNoteIds } = usePianoRoll()
  const song = useSong()
  const selectNote = useSelectNote()
  const startNote = useStartNote()
  const stopNote = useStopNote()

  return (deltaIndex: number) => {
    if (selectedTrack === undefined || selectedNoteIds.length === 0) {
      return
    }

    const allNotes = selectedTrack.events.filter(isNoteEvent)
    const selectedNotes = sortedNotes(
      selectedNoteIds
        .map((id) => allNotes.find((n) => n.id === id))
        .filter(isNotUndefined),
    )
    if (selectedNotes.length === 0) {
      return
    }
    const channel = selectedTrack?.channel ?? 0
    const firstNote = sortedNotes(selectedNotes)[0]
    const notes = sortedNotes(allNotes)
    const currentIndex = notes.findIndex((n) => n.id === firstNote.id)
    const currentNote = notes[currentIndex]
    const nextNote = notes[currentIndex + deltaIndex]
    if (nextNote === undefined) {
      return
    }

    selectNote(nextNote.id)

    // Stop playing the current note, then play the new note.
    stopNote({ ...currentNote, channel })
    startNote({ ...nextNote, channel })
    stopNote(
      { ...nextNote, channel },
      tickToMillisec(nextNote.duration, 120, song.timebase) / 1000,
    )
  }
}

export const useSelectNextNote = () => {
  const selectNeighborNote = useSelectNeighborNote()
  return () => selectNeighborNote(1)
}

export const useSelectPreviousNote = () => {
  const selectNeighborNote = useSelectNeighborNote()
  return () => selectNeighborNote(-1)
}

export const useQuantizeSelectedNotes = () => {
  const {
    selectedTrack,
    selectedNoteIds,
    enabledQuantizer: quantizer,
  } = usePianoRoll()
  const { pushHistory } = useHistory()

  return () => {
    if (selectedTrack === undefined || selectedNoteIds.length === 0) {
      return
    }

    pushHistory()

    const notes = selectedNoteIds
      .map((id) => selectedTrack.getEventById(id))
      .filter(isNotUndefined)
      .filter(isNoteEvent)
      .map((e) => ({
        ...e,
        tick: quantizer.round(e.tick),
      }))

    selectedTrack.updateEvents(notes)
  }
}

export const useSelectAllNotes = () => {
  const { selectedTrack, setSelectedNoteIds } = usePianoRoll()
  const { setSelectedEventIds } = useControlPane()

  return useCallback(() => {
    if (selectedTrack) {
      setSelectedNoteIds(
        selectedTrack.events.filter(isNoteEvent).map((note) => note.id),
      )
      setSelectedEventIds([])
    }
  }, [selectedTrack, setSelectedNoteIds, setSelectedEventIds])
}
