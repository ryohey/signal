import {
  CloudSong,
  ICloudSongDataRepository,
  ICloudSongRepository,
} from "@signal-app/api"
import { useDialog, useProgress, usePrompt, useToast } from "dialog-hooks"
import { orderBy } from "lodash"
import { computed, makeObservable, observable } from "mobx"
import {
  ChangeEvent,
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react"
import { useOpenSong, useSaveSong, useSetSong } from "../actions"
import { useCreateSong, useUpdateSong } from "../actions/cloudSong"
import { hasFSAccess, saveFileAs, useOpenFile } from "../actions/file"
import { useLocalization } from "../localize/useLocalization"
import {
  cloudSongDataRepository,
  cloudSongRepository,
} from "../services/repositories"
import { emptySong } from "../song"
import { SongStore } from "../stores/SongStore"
import { useAutoSave } from "./useAutoSave"
import { useMobxSelector } from "./useMobxSelector"
import { useRootView } from "./useRootView"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

class CloudFileStore {
  isLoading = false
  selectedColumn: "name" | "date" = "date"
  dateType: "created" | "updated" = "created"
  sortAscending = false
  _files: CloudSong[] = []

  constructor(
    private readonly songStore: SongStore,
    private readonly cloudSongRepository: ICloudSongRepository,
    private readonly cloudSongDataRepository: ICloudSongDataRepository,
  ) {
    makeObservable(this, {
      isLoading: observable,
      selectedColumn: observable,
      dateType: observable,
      sortAscending: observable,
      _files: observable,
      files: computed,
    })
  }

  async load() {
    this.isLoading = true
    this._files = await this.cloudSongRepository.getMySongs()
    this.isLoading = false
  }

  get files() {
    return orderBy(
      this._files,
      (data) => {
        switch (this.selectedColumn) {
          case "name":
            return data.name
          case "date":
            switch (this.dateType) {
              case "created":
                return data.createdAt.getTime()
              case "updated":
                return data.updatedAt.getTime()
            }
        }
      },
      this.sortAscending ? "asc" : "desc",
    )
  }

  async deleteSong(song: CloudSong) {
    await this.cloudSongDataRepository.delete(song.songDataId)
    await this.cloudSongRepository.delete(song.id)

    if (this.songStore.song.cloudSongId === song.id) {
      this.songStore.song.cloudSongId = null
      this.songStore.song.cloudSongDataId = null
    }
    await this.load()
  }
}

const CloudFileStoreContext = createContext<CloudFileStore>(null!)

export function CloudFileProvider({ children }: { children: React.ReactNode }) {
  const { songStore } = useStores()
  const cloudFileStore = useMemo(
    () =>
      new CloudFileStore(
        songStore,
        cloudSongRepository,
        cloudSongDataRepository,
      ),
    [songStore],
  )

  return (
    <CloudFileStoreContext.Provider value={cloudFileStore}>
      {children}
    </CloudFileStoreContext.Provider>
  )
}

export const useCloudFile = () => {
  const { setOpenCloudFileDialog, setOpenPublishDialog } = useRootView()
  const cloudFileStore = useContext(CloudFileStoreContext)
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
      return useMobxSelector(() => cloudFileStore.isLoading, [cloudFileStore])
    },
    get dateType() {
      return useMobxSelector(() => cloudFileStore.dateType, [cloudFileStore])
    },
    get files() {
      return useMobxSelector(() => cloudFileStore.files, [cloudFileStore])
    },
    get selectedColumn() {
      return useMobxSelector(
        () => cloudFileStore.selectedColumn,
        [cloudFileStore],
      )
    },
    get sortAscending() {
      return useMobxSelector(
        () => cloudFileStore.sortAscending,
        [cloudFileStore],
      )
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
    async deleteSong(song: CloudSong) {
      await cloudFileStore.deleteSong(song)
    },
  }
}
