import { CloudSong } from "@signal-app/api"
import { useDialog, useProgress, usePrompt, useToast } from "dialog-hooks"
import { ChangeEvent, useCallback } from "react"
import { useOpenSong, useSaveSong, useSetSong } from "../actions"
import { useCreateSong, useUpdateSong } from "../actions/cloudSong"
import { hasFSAccess, saveFileAs, useOpenFile } from "../actions/file"
import { useLocalization } from "../localize/useLocalization"
import { emptySong } from "../song"
import { useMobxStore } from "./useMobxSelector"
import { useRootView } from "./useRootView"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

export const useCloudFile = () => {
  const { setOpenCloudFileDialog, setOpenPublishDialog } = useRootView()
  const { cloudFileStore } = useStores()
  const song = useSong()
  const toast = useToast()
  const prompt = usePrompt()
  const dialog = useDialog()
  const { show: showProgress } = useProgress()
  const localized = useLocalization()
  const setSong = useSetSong()
  const openSong = useOpenSong()
  const saveSong = useSaveSong()
  const openFile = useOpenFile()
  const updateSong = useUpdateSong()
  const createSong = useCreateSong()

  const saveOrCreateSong = async () => {
    if (song.cloudSongId !== null) {
      if (song.name.length === 0) {
        const text = await prompt.show({
          title: localized["save-as"],
        })
        if (text !== null && text.length > 0) {
          song.name = text
        }
      }
      const closeProgress = showProgress(localized["song-saving"])
      try {
        await updateSong(song)
        toast.success(localized["song-saved"])
      } catch (e) {
        alert((e as Error).message)
      } finally {
        closeProgress()
      }
    } else {
      if (song.name.length === 0) {
        const text = await prompt.show({
          title: localized["save-as"],
        })
        if (text !== null && text.length > 0) {
          song.name = text
        }
      }
      const closeProgress = showProgress(localized["song-saving"])
      try {
        await createSong(song)
        toast.success(localized["song-created"])
      } catch (e) {
        alert((e as Error).message)
      } finally {
        closeProgress()
      }
    }
  }

  // true: saved or not necessary
  // false: canceled
  const saveIfNeeded = async (): Promise<boolean> => {
    if (song.isSaved) {
      return true
    }

    const res = await dialog.show({
      title: localized["save-changes"],
      actions: [
        { title: localized["yes"], key: "yes" },
        { title: localized["no"], key: "no" },
        { title: localized["cancel"], key: "cancel" },
      ],
    })
    switch (res) {
      case "yes":
        await saveOrCreateSong()
        return true
      case "no":
        return true
      case "cancel":
        return false
    }
  }

  return {
    get isLoading() {
      return useMobxStore(({ cloudFileStore }) => cloudFileStore.isLoading)
    },
    get dateType() {
      return useMobxStore(({ cloudFileStore }) => cloudFileStore.dateType)
    },
    get files() {
      return useMobxStore(({ cloudFileStore }) => cloudFileStore.files)
    },
    get selectedColumn() {
      return useMobxStore(({ cloudFileStore }) => cloudFileStore.selectedColumn)
    },
    get sortAscending() {
      return useMobxStore(({ cloudFileStore }) => cloudFileStore.sortAscending)
    },
    setDateType: useCallback(
      (type: "created" | "updated") => {
        cloudFileStore.dateType = type
      },
      [cloudFileStore],
    ),
    setSelectedColumn: useCallback(
      (column: "name" | "date") => {
        cloudFileStore.selectedColumn = column
      },
      [cloudFileStore],
    ),
    setSortAscending: useCallback(
      (ascending: boolean) => {
        cloudFileStore.sortAscending = ascending
      },
      [cloudFileStore],
    ),
    loadFiles: useCallback(() => {
      cloudFileStore.load()
    }, [cloudFileStore]),
    async createNewSong() {
      try {
        if (!(await saveIfNeeded())) {
          return
        }
        const newSong = emptySong()
        setSong(newSong)
        await createSong(newSong)
        toast.success(localized["song-created"])
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async openSong() {
      try {
        if (!(await saveIfNeeded())) {
          return
        }
        setOpenCloudFileDialog(true)
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async saveSong() {
      await saveOrCreateSong()
    },
    async saveAsSong() {
      try {
        const text = await prompt.show({
          title: localized["save-as"],
          initialText: song.name,
        })
        if (text !== null && text.length > 0) {
          song.name = text
        } else {
          return
        }
        await createSong(song)
        toast.success(localized["song-saved"])
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async renameSong() {
      try {
        const text = await prompt.show({
          title: localized["rename"],
        })
        if (text !== null && text.length > 0) {
          song.name = text
        } else {
          return Promise.resolve(false)
        }
        if (song.cloudSongId !== null) {
          await updateSong(song)
        } else {
          await createSong(song)
        }
        toast.success(localized["song-saved"])
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async importSong() {
      try {
        if (!(await saveIfNeeded())) {
          return
        }
        await openFile()
        await saveOrCreateSong()
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async importSongLegacy(e: ChangeEvent<HTMLInputElement>) {
      try {
        await openSong(e.currentTarget)
        await saveOrCreateSong()
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async exportSong() {
      try {
        if (hasFSAccess) {
          await saveFileAs(song)
        } else {
          saveSong()
        }
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    async publishSong() {
      setOpenPublishDialog(true)
    },
    async deleteSong(song: CloudSong) {
      await cloudFileStore.deleteSong(song)
    },
  }
}
