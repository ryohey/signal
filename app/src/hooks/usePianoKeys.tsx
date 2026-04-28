import { useCallback, useMemo, useState } from "react"
import { selectNotesByPitchRange } from "../actions/selection"
import { usePianoRoll } from "./usePianoRoll"
import { usePreviewNote } from "./usePreviewNote"
import { useStores } from "./useStores"
import { useTrack } from "./useTrack"

export function usePianoKeys() {
  const {
    keySignature,
    transform: { numberOfKeys, pixelsPerKey: keyHeight },
    previewingNoteNumbers,
    selectedTrackId,
    mouseMode,
    setSelectedNoteIds,
    setSelection,
  } = usePianoRoll()
  const [touchingKeys, setTouchingKeys] = useState<Set<number>>(new Set())
  const [startKeyNumber, setStartKeyNumber] = useState<number | null>(null)
  const { previewNoteOn, previewNoteOff } = usePreviewNote()
  const { synth } = useStores()
  const { programNumber, isRhythmTrack, getEvents } = useTrack(selectedTrackId)
  const selectedKeys = useMemo(
    () => new Set([...touchingKeys, ...previewingNoteNumbers]),
    [touchingKeys, previewingNoteNumbers],
  )

  const onMouseDownKey = useCallback(
    (noteNumber: number) => {
      if (mouseMode === "selection") {
        // In selection mode: start range selection from this key
        setStartKeyNumber(noteNumber)
        setTouchingKeys(new Set([noteNumber]))
        // Reset the rectangle selection
        setSelection(null)
      } else {
        // In pencil mode: preview the note
        previewNoteOn(noteNumber)
        setTouchingKeys(new Set([noteNumber]))
      }
    },
    [mouseMode, previewNoteOn, setSelection],
  )

  const onMouseMoveKey = useCallback(
    (noteNumber: number) => {
      if (mouseMode === "selection") {
        // In selection mode: update the range selection
        if (startKeyNumber !== null) {
          const minKey = Math.min(startKeyNumber, noteNumber)
          const maxKey = Math.max(startKeyNumber, noteNumber)
          // Update visual feedback: show all keys in the range
          const keysInRange = new Set<number>()
          for (let i = minKey; i <= maxKey; i++) {
            keysInRange.add(i)
          }
          setTouchingKeys(keysInRange)
        }
      } else {
        // In pencil mode: preview the moving note
        previewNoteOff()
        previewNoteOn(noteNumber)
        setTouchingKeys(new Set([noteNumber]))
      }
    },
    [mouseMode, previewNoteOff, previewNoteOn, startKeyNumber],
  )

  const onMouseUpKey = useCallback(() => {
    if (mouseMode === "selection") {
      // In selection mode: confirm the selection
      if (startKeyNumber !== null) {
        const lastTouchingKey = Array.from(touchingKeys).pop()
        if (lastTouchingKey !== undefined) {
          const fromNote = startKeyNumber
          const toNote = lastTouchingKey
          // Get all notes within the pitch range
          const noteIds = selectNotesByPitchRange(
            getEvents(),
            fromNote,
            toNote,
          )
          setSelectedNoteIds(noteIds)
        }
      }
      setStartKeyNumber(null)
      setTouchingKeys(new Set())
    } else {
      // In pencil mode: stop preview
      previewNoteOff()
      setTouchingKeys(new Set())
    }
  }, [mouseMode, previewNoteOff, startKeyNumber, touchingKeys, getEvents, setSelectedNoteIds])

  const keyNames = useMemo<Map<number, string> | null>(() => {
    if (!isRhythmTrack || !synth.loadedSoundFont) {
      return null
    }

    const presets = synth.loadedSoundFont.getDrumKitPresets().get(programNumber)
    if (!presets) {
      return null
    }

    return mapmap(presets.samples, (samples) => {
      return samples[0]?.name
    })
  }, [synth.loadedSoundFont, isRhythmTrack, programNumber])

  return {
    selectedKeys,
    onMouseDownKey,
    onMouseMoveKey,
    onMouseUpKey,
    keySignature,
    numberOfKeys,
    keyHeight,
    keyNames,
  }
}

function mapmap<K, V, R>(
  map: Map<K, V>,
  fn: (value: V, key: K) => R,
): Map<K, R> {
  const result = new Map<K, R>()
  for (const [key, value] of map.entries()) {
    const newValue = fn(value, key)
    if (newValue !== undefined) {
      result.set(key, newValue)
    }
  }
  return result
}
