import { useDerivedValue } from "../../../hooks/useDerivedValue"
import { useTempoEditorService } from "./useTempoEditor"

export function useTempoItems() {
  const tempoEditor = useTempoEditorService()
  return useDerivedValue(tempoEditor.observeItems, tempoEditor.listItems)
}
