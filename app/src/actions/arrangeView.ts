import mapValues from "lodash/mapValues"
import { useCallback } from "react"
import {
  ArrangeNotesClipboardData,
  ArrangeNotesClipboardDataSchema,
} from "../clipboard/clipboardTypes"
import { BatchUpdateOperation } from "../commands/track"
import { isNotUndefined } from "../helpers/array"
import { useArrangeView } from "../hooks/useArrangeView"
import { useCommands } from "../hooks/useCommands"
import { useHistory } from "../hooks/useHistory"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../services/Clipboard"

export const useArrangeCopySelection = () => {
  const { tracks } = useSong()
  const { selection, selectedEventIds } = useArrangeView()

  return () => {
    if (selection === null) {
      return
    }

    const notes = mapValues(selectedEventIds, (ids, trackIndex) => {
      const track = tracks[parseInt(trackIndex, 10)]
      return ids
        .map((id) => track.getEventById(id))
        .filter(isNotUndefined)
        .map((note) => ({
          ...note,
          tick: note.tick - selection.fromTick,
        }))
    })
    const data: ArrangeNotesClipboardData = {
      type: "arrange_notes",
      notes,
      selectedTrackIndex: selection.fromTrackIndex,
    }
    writeClipboardData(data)
  }
}

export const useArrangePasteSelection = () => {
  const { position } = usePlayer()
  const { tracks } = useSong()
  const { pushHistory } = useHistory()
  const { selectedTrackIndex } = useArrangeView()

  return async (e?: ClipboardEvent) => {
    const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
    const { data, error } = ArrangeNotesClipboardDataSchema.safeParse(obj)

    if (!data) {
      console.error("Invalid clipboard data", error)
      return
    }

    pushHistory()

    for (const trackIndex in data.notes) {
      const notes = data.notes[trackIndex].map((note) => ({
        ...note,
        tick: note.tick + position,
      }))

      const isRulerSelected = selectedTrackIndex < 0
      const trackNumberOffset = isRulerSelected
        ? 0
        : -data.selectedTrackIndex + selectedTrackIndex

      const destTrackIndex = parseInt(trackIndex) + trackNumberOffset

      if (destTrackIndex < tracks.length) {
        tracks[destTrackIndex].addEvents(notes)
      }
    }
  }
}

export const useArrangeDeleteSelection = () => {
  const { pushHistory } = useHistory()
  const { setSelection, selection, setSelectedEventIds } = useArrangeView()
  const commands = useCommands()

  return () => {
    if (selection === null) {
      return
    }

    pushHistory()

    commands.arrange.deleteSelection(selection)
    setSelectedEventIds({})
    setSelection(null)
  }
}

export const useArrangeCutSelection = () => {
  const arrangeCopySelection = useArrangeCopySelection()
  const arrangeDeleteSelection = useArrangeDeleteSelection()

  return useCallback(() => {
    arrangeCopySelection()
    arrangeDeleteSelection()
  }, [arrangeCopySelection, arrangeDeleteSelection])
}

export const useArrangeTransposeSelection = () => {
  const { transposeNotes } = useSong()
  const { pushHistory } = useHistory()
  const { selectedEventIds } = useArrangeView()

  return (deltaPitch: number) => {
    pushHistory()
    transposeNotes(deltaPitch, selectedEventIds)
  }
}

export const useArrangeDuplicateSelection = () => {
  const { pushHistory } = useHistory()
  const { selection, setSelection, setSelectedEventIds } = useArrangeView()
  const commands = useCommands()

  return useCallback(() => {
    if (selection === null) {
      return
    }

    pushHistory()

    const { selection: newSelection, selectedEventIds: addedEventIds } =
      commands.arrange.duplicateSelection(selection)

    setSelection(newSelection)
    setSelectedEventIds(addedEventIds)
  }, [selection, pushHistory, setSelection, setSelectedEventIds, commands])
}

export const useArrangeBatchUpdateSelectedNotesVelocity = () => {
  const { pushHistory } = useHistory()
  const { selectedEventIds } = useArrangeView()
  const commands = useCommands()

  return (operation: BatchUpdateOperation) => {
    pushHistory()
    commands.arrange.batchUpdateNotesVelocity(selectedEventIds, operation)
  }
}
