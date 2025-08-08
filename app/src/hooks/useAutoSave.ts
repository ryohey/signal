import { useCallback } from "react"
import { useSetSong } from "../actions"
import { useStores } from "./useStores"

export function useAutoSave() {
  const { autoSaveService } = useStores()
  const setSong = useSetSong()

  return {
    onUserExplicitAction: autoSaveService.onUserExplicitAction,
    shouldShowAutoSaveDialog: useCallback(() => {
      return (
        autoSaveService.getShouldOfferRestore() &&
        autoSaveService.hasAutoSavedSong()
      )
    }, [autoSaveService]),
    restoreAutoSave: useCallback(() => {
      const restoredSong = autoSaveService.restore()
      if (restoredSong) {
        setSong(restoredSong)
        autoSaveService.clearAutoSave()
      }
    }, [autoSaveService, setSong]),
    getLastSaveTime: autoSaveService.getLastSaveTime,
  }
}
