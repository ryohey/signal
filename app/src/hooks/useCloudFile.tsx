import { CloudSong } from "@signal-app/api"
import { useDialog, useProgress, usePrompt, useToast } from "dialog-hooks"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { orderBy } from "lodash"
import { ChangeEvent } from "react"
import { useOpenSong, useSaveSong, useSetSong } from "../actions"
import { useCreateSong, useUpdateSong } from "../actions/cloudSong"
import { hasFSAccess, saveFileAs, useOpenFile } from "../actions/file"
import { useLocalization } from "../localize/useLocalization"
import {
  cloudSongDataRepository,
  cloudSongRepository,
} from "../services/repositories"
import { emptySong } from "../song"
import { useAutoSave } from "./useAutoSave"
import { useRootView } from "./useRootView"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

export const useCloudFile = () => {
  const { setOpenCloudFileDialog, setOpenPublishDialog } = useRootView()
  const { cloudSongId, name, setName, isSaved, getSong } = useSong()
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
  const { onUserExplicitAction } = useAutoSave()
  const loadFiles = useLoadFiles()
  const deleteSong = useDeleteSong()

  const saveOrCreateSong = async () => {
    if (cloudSongId !== null) {
      if (name.length === 0) {
        const text = await prompt.show({
          title: localized["save-as"],
        })
        if (text !== null && text.length > 0) {
          setName(text)
        }
      }
      const closeProgress = showProgress(localized["song-saving"])
      try {
        await updateSong(getSong())
        toast.success(localized["song-saved"])
      } catch (e) {
        alert((e as Error).message)
      } finally {
        closeProgress()
      }
    } else {
      if (name.length === 0) {
        const text = await prompt.show({
          title: localized["save-as"],
        })
        if (text !== null && text.length > 0) {
          setName(text)
        }
      }
      const closeProgress = showProgress(localized["song-saving"])
      try {
        await createSong(getSong())
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
    if (isSaved) {
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
      return useAtomValue(isLoadingAtom)
    },
    get dateType() {
      return useAtomValue(dateTypeAtom)
    },
    get files() {
      return useAtomValue(sortedFilesAtom)
    },
    get selectedColumn() {
      return useAtomValue(selectedColumnAtom)
    },
    get sortAscending() {
      return useAtomValue(sortAscendingAtom)
    },
    setDateType: useSetAtom(dateTypeAtom),
    setSelectedColumn: useSetAtom(selectedColumnAtom),
    setSortAscending: useSetAtom(sortAscendingAtom),
    loadFiles: loadFiles,
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
          initialText: name,
        })
        if (text !== null && text.length > 0) {
          setName(text)
        } else {
          return
        }
        await createSong(getSong())
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
          setName(text)
        } else {
          return Promise.resolve(false)
        }
        if (cloudSongId !== null) {
          await updateSong(getSong())
        } else {
          await createSong(getSong())
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
          await saveFileAs(getSong())
          onUserExplicitAction()
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
    deleteSong,
  }
}

// atoms
const isLoadingAtom = atom<boolean>(false)
const selectedColumnAtom = atom<"name" | "date">("date")
const dateTypeAtom = atom<"created" | "updated">("created")
const sortAscendingAtom = atom<boolean>(false)
const filesAtom = atom<CloudSong[]>([])

// derived atom for sorted files
const sortedFilesAtom = atom((get) => {
  const files = get(filesAtom)
  const selectedColumn = get(selectedColumnAtom)
  const dateType = get(dateTypeAtom)
  const sortAscending = get(sortAscendingAtom)

  return orderBy(
    files,
    (data) => {
      switch (selectedColumn) {
        case "name":
          return data.name
        case "date":
          switch (dateType) {
            case "created":
              return data.createdAt.getTime()
            case "updated":
              return data.updatedAt.getTime()
          }
      }
    },
    sortAscending ? "asc" : "desc",
  )
})

function useDeleteSong() {
  const { songStore } = useStores()
  const loadFiles = useLoadFiles()

  return async (song: CloudSong) => {
    await cloudSongDataRepository.delete(song.songDataId)
    await cloudSongRepository.delete(song.id)

    if (songStore.song.cloudSongId === song.id) {
      songStore.song.cloudSongId = null
      songStore.song.cloudSongDataId = null
    }
    await loadFiles()
  }
}

function useLoadFiles() {
  const setIsLoading = useSetAtom(isLoadingAtom)
  const setFiles = useSetAtom(filesAtom)

  return async () => {
    setIsLoading(true)
    const files = await cloudSongRepository.getMySongs()
    setFiles(files)
    setIsLoading(false)
  }
}
