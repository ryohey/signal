import { useToast } from "dialog-hooks"
import { type ChangeEvent, useCallback } from "react"
import { useCreateSong, useOpenSong, useSaveSong } from "../actions"
import { saveFile, saveFileAs, useOpenFile } from "../actions/file"
import { useLocalization } from "../localize/useLocalization"
import { useAutoSave } from "./useAutoSave"
import { useSong } from "./useSong"

export const useSongFile = () => {
  const { isSaved, getSong } = useSong()
  const toast = useToast()
  const localized = useLocalization()
  const createSong = useCreateSong()
  const openSong = useOpenSong()
  const saveSong = useSaveSong()
  const openFile = useOpenFile()
  const { onUserExplicitAction } = useAutoSave()

  return {
    createNewSong: useCallback(async () => {
      if (isSaved || confirm(localized["confirm-new"])) {
        createSong()
      }
    }, [isSaved, localized, createSong]),
    openSong: useCallback(async () => {
      try {
        if (isSaved || confirm(localized["confirm-open"])) {
          await openFile()
        }
      } catch (e) {
        toast.error((e as Error).message)
      }
    }, [isSaved, localized, openFile, toast]),
    openSongLegacy: useCallback(
      async (e: ChangeEvent<HTMLInputElement>) => {
        try {
          if (isSaved || confirm(localized["confirm-new"])) {
            await openSong(e.currentTarget)
          }
        } catch (e) {
          toast.error((e as Error).message)
        }
      },
      [isSaved, localized, openSong, toast]
    ),
    saveSong: useCallback(async () => {
      await saveFile(getSong())
      onUserExplicitAction()
    }, [getSong, onUserExplicitAction]),
    saveAsSong: useCallback(async () => {
      await saveFileAs(getSong())
      onUserExplicitAction()
    }, [getSong, onUserExplicitAction]),
    downloadSong: useCallback(async () => {
      saveSong()
    }, [saveSong]),
  }
}
