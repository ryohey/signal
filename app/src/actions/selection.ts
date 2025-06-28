import { max, min } from "lodash"
import { useCallback } from "react"
import {
  PianoNotesClipboardData,
  PianoNotesClipboardDataSchema,
} from "../clipboard/clipboardTypes"
import { Rect } from "../entities/geometry/Rect"
import { Selection } from "../entities/selection/Selection"
import { isNotUndefined } from "../helpers/array"
import { useControlPane } from "../hooks/useControlPane"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { usePreviewNote } from "../hooks/usePreviewNote"
import { useQuantizer } from "../hooks/useQuantizer"
import { useSong } from "../hooks/useSong"
import { useTrack } from "../hooks/useTrack"
import { readClipboardData, writeClipboardData } from "../services/Clipboard"
import { NoteEvent, TrackEvent, isNoteEvent } from "../track"

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
  const { transposeNotes } = useSong()
  const { selectedTrackIndex, selection, selectedNoteIds, setSelection } =
    usePianoRoll()
  const { pushHistory } = useHistory()

  return (deltaPitch: number) => {
    pushHistory()

    if (selection !== null) {
      const s = Selection.moved(selection, 0, deltaPitch)
      setSelection(s)
    }

    transposeNotes(deltaPitch, {
      [selectedTrackIndex]: selectedNoteIds,
    })
  }
}

export const useCloneSelection = () => {
  const { selection, selectedNoteIds, selectedTrackId, setSelectedNoteIds } =
    usePianoRoll()
  const { getEventById, addEvents } = useTrack(selectedTrackId)

  return () => {
    if (selection === null) {
      return
    }

    // 選択範囲内のノートをコピーした選択範囲を作成
    // Create a selection that copies notes within selection
    const notes = selectedNoteIds
      .map((id) => getEventById(id))
      .filter(isNotUndefined)
      .map((note) => ({
        ...note, // copy
      }))
    addEvents(notes)
    setSelectedNoteIds(notes.map((e) => e.id))
  }
}

export const useCopySelection = () => {
  const { selection, selectedNoteIds, selectedTrackId } = usePianoRoll()
  const { getEventById } = useTrack(selectedTrackId)

  return async () => {
    if (selectedNoteIds.length === 0) {
      return
    }

    const selectedNotes = selectedNoteIds
      .map((id) => getEventById(id))
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

    await writeClipboardData(data)
  }
}

export const useDeleteSelection = () => {
  const {
    selection,
    selectedNoteIds,
    selectedTrackId,
    setSelection,
    setSelectedNoteIds,
  } = usePianoRoll()
  const { removeEvents } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  return () => {
    if (selectedNoteIds.length === 0 && selection === null) {
      return
    }

    pushHistory()

    // 選択範囲と選択されたノートを削除
    // Remove selected notes and selected notes
    removeEvents(selectedNoteIds)
    setSelection(null)
    setSelectedNoteIds([])
  }
}

// Paste notes copied to the current position
export const usePasteSelection = () => {
  const { selectedTrackId } = usePianoRoll()
  const { addEvents } = useTrack(selectedTrackId)
  const { position } = usePlayer()
  const { pushHistory } = useHistory()

  return async (clipboardData?: any) => {
    const obj = clipboardData ?? (await readClipboardData())
    const { data } = PianoNotesClipboardDataSchema.safeParse(obj)

    if (!data) {
      return
    }

    pushHistory()

    const notes = data.notes.map((note) => ({
      ...note,
      tick: Math.max(0, note.tick + position),
    }))
    addEvents(notes)
  }
}

export const useDuplicateSelection = () => {
  const {
    selection,
    selectedNoteIds,
    selectedTrackId,
    setSelection,
    setSelectedNoteIds,
  } = usePianoRoll()
  const { getEventById, addEvents } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  return () => {
    if (selection === null || selectedNoteIds.length === 0) {
      return
    }

    pushHistory()

    // move to the end of selection
    let deltaTick = selection.toTick - selection.fromTick

    const selectedNotes = selectedNoteIds
      .map((id) => getEventById(id))
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
    const addedNotes = addEvents(notes)
    setSelection(Selection.moved(selection, deltaTick, 0))
    setSelectedNoteIds(addedNotes?.map((n) => n.id) ?? [])
  }
}

export const useSelectNote = () => {
  const { setSelectedNoteIds } = usePianoRoll()
  const { setSelectedEventIds } = useControlPane()

  return (noteId: number) => {
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
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const { previewNoteOn } = usePreviewNote()
  const { getEvents } = useTrack(selectedTrackId)
  const selectNote = useSelectNote()

  return (deltaIndex: number) => {
    if (selectedNoteIds.length === 0) {
      return
    }

    const allNotes = getEvents().filter(isNoteEvent)
    const selectedNotes = sortedNotes(
      selectedNoteIds
        .map((id) => allNotes.find((n) => n.id === id))
        .filter(isNotUndefined),
    )
    if (selectedNotes.length === 0) {
      return
    }
    const firstNote = sortedNotes(selectedNotes)[0]
    const notes = sortedNotes(allNotes)
    const currentIndex = notes.findIndex((n) => n.id === firstNote.id)
    const nextNote = notes[currentIndex + deltaIndex]
    if (nextNote === undefined) {
      return
    }

    selectNote(nextNote.id)
    previewNoteOn(nextNote.noteNumber, nextNote.duration)
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
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const { enabledQuantizer: quantizer } = useQuantizer()
  const { getEventById, updateEvents } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()

  return () => {
    if (selectedNoteIds.length === 0) {
      return
    }

    pushHistory()

    const notes = selectedNoteIds
      .map((id) => getEventById(id))
      .filter(isNotUndefined)
      .filter(isNoteEvent)
      .map((e) => ({
        ...e,
        tick: quantizer.round(e.tick),
      }))

    updateEvents(notes)
  }
}

export const useSelectAllNotes = () => {
  const { selectedTrackId, setSelectedNoteIds } = usePianoRoll()
  const { getEvents } = useTrack(selectedTrackId)
  const { setSelectedEventIds } = useControlPane()

  return useCallback(() => {
    setSelectedNoteIds(
      getEvents()
        .filter(isNoteEvent)
        .map((note) => note.id),
    )
    setSelectedEventIds([])
  }, [getEvents, setSelectedNoteIds, setSelectedEventIds])
}
