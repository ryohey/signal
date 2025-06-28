import { useToast } from "dialog-hooks"
import { ChangeEvent } from "react"
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
    async createNewSong() {
      if (isSaved || confirm(localized["confirm-new"])) {
        createSong()
      }
    },
    async openSong() {
      try {
        if (isSaved || confirm(localized["confirm-open"])) {
          await openFile()
        }
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async openSongLegacy(e: ChangeEvent<HTMLInputElement>) {
      try {
        if (isSaved || confirm(localized["confirm-new"])) {
          await openSong(e.currentTarget)
        }
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async saveSong() {
      await saveFile(getSong())
      onUserExplicitAction()
    },
    async saveAsSong() {
      await saveFileAs(getSong())
      onUserExplicitAction()
    },
    async downloadSong() {
      saveSong()
    },
  }
}
