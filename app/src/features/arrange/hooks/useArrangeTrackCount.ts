import { useDerivedValue } from "../../../hooks/useDerivedValue"
import { useArrangeEditor } from "./useArrangeEditor"

// Reactive track count for render-time consumers. Subscribes to track-list
// changes only, so editing notes doesn't re-render them.
export function useArrangeTrackCount() {
  const arrangeEditor = useArrangeEditor()
  return useDerivedValue(
    arrangeEditor.observeTrackCount,
    arrangeEditor.getTrackCount,
  )
}
