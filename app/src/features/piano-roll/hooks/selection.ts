import { PianoNotesClipboardDataSchema } from "@signal-app/pianoroll-editor"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { usePreviewNote } from "../../../hooks/usePreviewNote"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../../../services/Clipboard"
import { useControlPane } from "../../control-pane/hooks/useControlPane"
import { Selection } from "../entities/Selection"
import { usePianoRoll, usePianoRollQuantizer } from "./usePianoRoll"
import { usePianoRollEditor } from "./usePianoRollEditor"

export const useTransposeSelection = () => {
  const { selection, selectedNoteIds, setSelection } = usePianoRoll()
  const { pushHistory } = useHistory()
  const pianoRollEditor = usePianoRollEditor()

  return useCallback(
    (deltaPitch: number) => {
      pushHistory()

      if (selection !== null) {
        const s = Selection.moved(selection, 0, deltaPitch)
        setSelection(s)
      }

      pianoRollEditor.transposeNotes(selectedNoteIds, deltaPitch)
    },
    [pushHistory, selection, setSelection, pianoRollEditor, selectedNoteIds],
  )
}

export const useCloneSelection = () => {
  const { selection, selectedNoteIds, setSelectedNoteIds } = usePianoRoll()
  const pianoRollEditor = usePianoRollEditor()

  return useCallback(() => {
    if (selection === null) {
      return
    }
    // Create a selection that copies notes within selection
    const newNoteIds = pianoRollEditor.cloneNotes(selectedNoteIds)
    setSelectedNoteIds(newNoteIds)
  }, [selection, selectedNoteIds, pianoRollEditor, setSelectedNoteIds])
}

export const useCopySelection = () => {
  const { selection, selectedNoteIds } = usePianoRoll()
  const pianoRollEditor = usePianoRollEditor()

  return useCallback(async () => {
    if (selectedNoteIds.length === 0) {
      return
    }
    const data = pianoRollEditor.getNotesClipboardData(
      selectedNoteIds,
      selection?.fromTick,
    )
    if (!data) {
      return
    }
    await writeClipboardData(data)
  }, [selection, selectedNoteIds, pianoRollEditor])
}

export const useDeleteSelection = () => {
  const { selection, selectedNoteIds, setSelection, setSelectedNoteIds } =
    usePianoRoll()
  const pianoRollEditor = usePianoRollEditor()
  const { pushHistory } = useHistory()

  return useCallback(() => {
    if (selectedNoteIds.length === 0 && selection === null) {
      return
    }

    pushHistory()

    // 選択範囲と選択されたノートを削除
    // Remove selected notes and selected notes
    pianoRollEditor.removeNotes(selectedNoteIds)
    setSelection(null)
    setSelectedNoteIds([])
  }, [
    selectedNoteIds,
    selection,
    pushHistory,
    pianoRollEditor,
    setSelection,
    setSelectedNoteIds,
  ])
}

// Paste notes copied to the current position
export const usePasteSelection = () => {
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const pianoRollEditor = usePianoRollEditor()

  return useCallback(
    async (e?: ClipboardEvent) => {
      const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
      const { data } = PianoNotesClipboardDataSchema.safeParse(obj)

      if (!data) {
        return
      }

      pushHistory()

      pianoRollEditor.addClipboardNotes(data, position)
    },
    [pianoRollEditor, position, pushHistory],
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
  const { selection, selectedNoteIds, setSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { pushHistory } = useHistory()
  const pianoRollEditor = usePianoRollEditor()

  return useCallback(() => {
    if (selection === null && selectedNoteIds.length === 0) {
      return
    }

    pushHistory()

    // move to the end of selection
    const deltaTick = selection ? selection.toTick - selection.fromTick : 0
    const { addedNoteIds, deltaTick: newDeltaTick } =
      pianoRollEditor.duplicateNotes(selectedNoteIds, deltaTick)

    if (selection) {
      setSelection(Selection.moved(selection, newDeltaTick, 0))
    }
    setSelectedNoteIds(addedNoteIds)
  }, [
    selection,
    selectedNoteIds,
    pushHistory,
    pianoRollEditor,
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

const useSelectNeighborNote = () => {
  const { selectedNoteIds } = usePianoRoll()
  const { previewNoteOn } = usePreviewNote()
  const pianoRollEditor = usePianoRollEditor()
  const selectNote = useSelectNote()

  return useCallback(
    (deltaIndex: number) => {
      const nextNote = pianoRollEditor.getNeighborNote(
        deltaIndex,
        selectedNoteIds,
      )
      if (nextNote === null) {
        return
      }

      selectNote(nextNote.id)
      previewNoteOn(nextNote.noteNumber, nextNote.duration)
    },
    [selectedNoteIds, pianoRollEditor, selectNote, previewNoteOn],
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
  const { selectedNoteIds } = usePianoRoll()
  const { forceQuantizeRound } = usePianoRollQuantizer()
  const { pushHistory } = useHistory()
  const pianoRollEditor = usePianoRollEditor()

  return useCallback(() => {
    if (selectedNoteIds.length === 0) {
      return
    }
    pushHistory()
    pianoRollEditor.quantizeNotes(selectedNoteIds, forceQuantizeRound)
  }, [selectedNoteIds, pushHistory, pianoRollEditor, forceQuantizeRound])
}

export const useSelectAllNotes = () => {
  const { setSelectedNoteIds } = usePianoRoll()
  const pianoRollEditor = usePianoRollEditor()
  const { setSelectedEventIds } = useControlPane()

  return useCallback(() => {
    setSelectedNoteIds(pianoRollEditor.getAllNoteIds())
    setSelectedEventIds([])
  }, [pianoRollEditor, setSelectedNoteIds, setSelectedEventIds])
}
