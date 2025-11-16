import {
  NoteEvent,
  PianoNotesClipboardData,
  PianoNotesClipboardDataSchema,
  TrackEvent,
  isNoteEvent,
} from "@signal-app/core"
import { min } from "lodash"
import { useCallback } from "react"
import { Rect } from "../entities/geometry/Rect"
import { Selection } from "../entities/selection/Selection"
import { isNotUndefined } from "../helpers/array"
import { useCommands } from "../hooks/useCommands"
import { useControlPane } from "../hooks/useControlPane"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll, usePianoRollQuantizer } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { usePreviewNote } from "../hooks/usePreviewNote"
import { useTrack } from "../hooks/useTrack"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../services/Clipboard"

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
  const commands = useCommands()
  const { selectedTrackId, selection, selectedNoteIds, setSelection } =
    usePianoRoll()
  const { pushHistory } = useHistory()

  return useCallback(
    (deltaPitch: number) => {
      pushHistory()

      if (selection !== null) {
        const s = Selection.moved(selection, 0, deltaPitch)
        setSelection(s)
      }

      commands.track.transposeNotes(
        selectedTrackId,
        selectedNoteIds,
        deltaPitch,
      )
    },
    [
      pushHistory,
      selection,
      setSelection,
      commands,
      selectedTrackId,
      selectedNoteIds,
    ],
  )
}

export const useCloneSelection = () => {
  const { selection, selectedNoteIds, selectedTrackId, setSelectedNoteIds } =
    usePianoRoll()
  const { getEventById, addEvents } = useTrack(selectedTrackId)

  return useCallback(() => {
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
  }, [selection, selectedNoteIds, getEventById, addEvents, setSelectedNoteIds])
}

export const useCopySelection = () => {
  const { selection, selectedNoteIds, selectedTrackId } = usePianoRoll()
  const { getEventById } = useTrack(selectedTrackId)

  return useCallback(async () => {
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
  }, [selection, selectedNoteIds, getEventById])
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

  return useCallback(() => {
    if (selectedNoteIds.length === 0 && selection === null) {
      return
    }

    pushHistory()

    // 選択範囲と選択されたノートを削除
    // Remove selected notes and selected notes
    removeEvents(selectedNoteIds)
    setSelection(null)
    setSelectedNoteIds([])
  }, [
    selectedNoteIds,
    selection,
    pushHistory,
    removeEvents,
    setSelection,
    setSelectedNoteIds,
  ])
}

// Paste notes copied to the current position
export const usePasteSelection = () => {
  const { selectedTrackId } = usePianoRoll()
  const { addEvents } = useTrack(selectedTrackId)
  const { position } = usePlayer()
  const { pushHistory } = useHistory()

  return useCallback(
    async (e?: ClipboardEvent) => {
      const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
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
    },
    [addEvents, position, pushHistory],
  )
}

export const useCutSelection = () => {
  const copySelection = useCopySelection()
  const deleteSelection = useDeleteSelection()
  return useCallback(() => {
    copySelection()
    deleteSelection()
  }, [copySelection, deleteSelection])
}

export const useDuplicateSelection = () => {
  const {
    selection,
    selectedNoteIds,
    selectedTrackId,
    setSelection,
    setSelectedNoteIds,
  } = usePianoRoll()
  const { pushHistory } = useHistory()
  const commands = useCommands()

  return useCallback(() => {
    if (selection === null && selectedNoteIds.length === 0) {
      return
    }

    pushHistory()

    // move to the end of selection
    const deltaTick = selection ? selection.toTick - selection.fromTick : 0
    const { addedNoteIds, deltaTick: newDeltaTick } =
      commands.track.duplicateNotes(selectedTrackId, selectedNoteIds, deltaTick)

    if (selection) {
      setSelection(Selection.moved(selection, newDeltaTick, 0))
    }
    setSelectedNoteIds(addedNoteIds)
  }, [
    selection,
    selectedNoteIds,
    pushHistory,
    commands,
    selectedTrackId,
    setSelection,
    setSelectedNoteIds,
  ])
}

export const useSelectNote = () => {
  const { setSelectedNoteIds } = usePianoRoll()
  const { setSelectedEventIds } = useControlPane()

  return useCallback(
    (noteId: number) => {
      setSelectedEventIds([])
      setSelectedNoteIds([noteId])
    },
    [setSelectedEventIds, setSelectedNoteIds],
  )
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

  return useCallback(
    (deltaIndex: number) => {
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
    },
    [selectedNoteIds, getEvents, selectNote, previewNoteOn],
  )
}

export const useSelectNextNote = () => {
  const selectNeighborNote = useSelectNeighborNote()
  return useCallback(() => selectNeighborNote(1), [selectNeighborNote])
}

export const useSelectPreviousNote = () => {
  const selectNeighborNote = useSelectNeighborNote()
  return useCallback(() => selectNeighborNote(-1), [selectNeighborNote])
}

export const useQuantizeSelectedNotes = () => {
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const { forceQuantizeRound } = usePianoRollQuantizer()
  const { pushHistory } = useHistory()
  const commands = useCommands()

  return useCallback(() => {
    if (selectedNoteIds.length === 0) {
      return
    }
    pushHistory()
    commands.track.quantizeNotes(
      selectedTrackId,
      selectedNoteIds,
      forceQuantizeRound,
    )
  }, [
    selectedNoteIds,
    pushHistory,
    commands.track,
    selectedTrackId,
    forceQuantizeRound,
  ])
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
