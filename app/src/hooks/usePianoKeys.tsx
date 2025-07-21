import { useCallback, useMemo, useState } from "react"
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
  } = usePianoRoll()
  const [touchingKeys, setTouchingKeys] = useState<Set<number>>(new Set())
  const { previewNoteOn, previewNoteOff } = usePreviewNote()
  const { synth } = useStores()
  const { programNumber, isRhythmTrack } = useTrack(selectedTrackId)
  const selectedKeys = new Set([...touchingKeys, ...previewingNoteNumbers])

  const onMouseDownKey = useCallback(
    (noteNumber: number) => {
      previewNoteOn(noteNumber)
      setTouchingKeys(new Set([noteNumber]))
    },
    [previewNoteOn],
  )

  const onMouseMoveKey = useCallback(
    (noteNumber: number) => {
      previewNoteOff()
      previewNoteOn(noteNumber)
      setTouchingKeys(new Set([noteNumber]))
    },
    [previewNoteOff, previewNoteOn],
  )

  const onMouseUpKey = useCallback(() => {
    previewNoteOff()
    setTouchingKeys(new Set())
  }, [previewNoteOff])

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
