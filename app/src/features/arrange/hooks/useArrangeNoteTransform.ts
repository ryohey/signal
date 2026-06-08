import { useMemo } from "react"
import { MaxNoteNumber } from "../../../Constants"
import { KeyTransform } from "../../piano-roll/entities/KeyTransform"
import { NoteCoordTransform } from "../../piano-roll/entities/NoteCoordTransform"
import { useArrangeTickScroll, useArrangeTrackScroll } from "./useArrangeView"

export function useArrangeNoteTransform() {
  return {
    get transform() {
      const { transform: tickTransform } = useArrangeTickScroll()
      const { trackHeight } = useArrangeTrackScroll()
      const bottomBorderWidth = 1
      const keyTransform = useMemo(
        () =>
          new KeyTransform(
            (trackHeight - bottomBorderWidth) / MaxNoteNumber,
            MaxNoteNumber,
          ),
        [trackHeight],
      )
      return useMemo(
        () => new NoteCoordTransform(tickTransform, keyTransform),
        [tickTransform, keyTransform],
      )
    },
  }
}
