import { useToast } from "dialog-hooks"
import { ChangeEvent } from "react"
import { useCreateSong, useOpenSong, useSaveSong } from "../actions"
import { saveFile, saveFileAs, useOpenFile } from "../actions/file"
import { useLocalization } from "../localize/useLocalization"
import { useSong } from "./useSong"

export const useSongFile = () => {
  const song = useSong()
  const toast = useToast()
  const localized = useLocalization()
  const createSong = useCreateSong()
  const openSong = useOpenSong()
  const saveSong = useSaveSong()
  const openFile = useOpenFile()

  return {
    async createNewSong() {
      if (song.isSaved || confirm(localized["confirm-new"])) {
        createSong()
      }
    },
    async openSong() {
      try {
        if (song.isSaved || confirm(localized["confirm-open"])) {
          await openFile()
        }
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async openSongLegacy(e: ChangeEvent<HTMLInputElement>) {
      try {
        if (song.isSaved || confirm(localized["confirm-new"])) {
          await openSong(e.currentTarget)
        }
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async saveSong() {
      await saveFile(song)
    },
    async saveAsSong() {
      await saveFileAs(song)
    },
    async downloadSong() {
      saveSong()
    },
  }
}
