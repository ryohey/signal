import { useCallback, useState } from "react"
import { usePianoRoll } from "./usePianoRoll"
import { usePreviewNote } from "./usePreviewNote"

export function usePianoKeys() {
  const {
    keySignature,
    transform: { numberOfKeys, pixelsPerKey: keyHeight },
    previewingNoteNumbers,
  } = usePianoRoll()
  const [touchingKeys, setTouchingKeys] = useState<Set<number>>(new Set())
  const { previewNoteOn, previewNoteOff } = usePreviewNote()
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

  return {
    selectedKeys,
    onMouseDownKey,
    onMouseMoveKey,
    onMouseUpKey,
    keySignature,
    numberOfKeys,
    keyHeight,
  }
}
