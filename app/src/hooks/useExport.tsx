import { renderAudio } from "@signal-app/player"
import { useDialog } from "dialog-hooks"
import { makeObservable, observable } from "mobx"
import { createContext, useCallback, useContext, useMemo } from "react"
import { downloadBlob } from "../helpers/Downloader"
import { encodeMp3, encodeWAV } from "../helpers/encodeAudio"
import { useLocalization } from "../localize/useLocalization"
import Song from "../song"
import { useMobxSelector } from "./useMobxSelector"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

class ExportStore {
  openExportProgressDialog = false
  progress = 0
  isCanceled = false

  constructor() {
    makeObservable(this, {
      openExportProgressDialog: observable,
      progress: observable,
    })
  }
}

const ExportStoreContext = createContext<ExportStore>(null!)

export function ExportProvider({ children }: { children: React.ReactNode }) {
  const exportStore = useMemo(() => new ExportStore(), [])

  return (
    <ExportStoreContext.Provider value={exportStore}>
      {children}
    </ExportStoreContext.Provider>
  )
}

export function useExport() {
  const exportStore = useContext(ExportStoreContext)

  return {
    get openExportProgressDialog() {
      return useMobxSelector(
        () => exportStore.openExportProgressDialog,
        [exportStore],
      )
    },
    get progress() {
      return useMobxSelector(() => exportStore.progress, [exportStore])
    },
    get exportSong() {
      return useExportSong()
    },
    setOpenExportProgressDialog: useCallback(
      (open: boolean) => {
        exportStore.openExportProgressDialog = open
      },
      [exportStore],
    ),
    cancelExport: useCallback(() => {
      exportStore.isCanceled = true
    }, [exportStore]),
  }
}

const waitForAnimationFrame = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

const useExportSong = () => {
  const exportStore = useContext(ExportStoreContext)
  const { synth } = useStores()
  const { updateEndOfSong, getSong, timebase } = useSong()
  const localized = useLocalization()
  const dialog = useDialog()

  return async (format: "WAV" | "MP3") => {
    updateEndOfSong()

    if (!canExport(getSong())) {
      await dialog.show({
        title: localized["export"],
        message: localized["export-error-too-short"],
        actions: [{ title: "OK", key: "ok" }],
      })
      return
    }

    const soundFontData = synth.loadedSoundFont?.data
    if (soundFontData === undefined) {
      return
    }

    const sampleRate = 44100

    exportStore.isCanceled = false
    exportStore.openExportProgressDialog = true
    exportStore.progress = 0

    try {
      const audioBuffer = await renderAudio(
        soundFontData,
        getSong().allEvents,
        timebase,
        sampleRate,
        {
          bufferSize: 128,
          cancel: () => exportStore.isCanceled,
          waitForEventLoop: waitForAnimationFrame,
          onProgress: (numFrames, totalFrames) =>
            (exportStore.progress = numFrames / totalFrames),
        },
      )

      exportStore.progress = 1

      const encoder = getEncoder(format)
      const audioData = await encoder.encode(audioBuffer)

      const blob = new Blob([audioData], { type: encoder.mimeType })
      exportStore.openExportProgressDialog = false
      downloadBlob(blob, "song." + encoder.ext)
    } catch (e) {
      console.warn(e)
    }
  }
}

const canExport = (song: Song) => song.allEvents.some((e) => e.tick >= 120)

const getEncoder = (format: "WAV" | "MP3") => {
  switch (format) {
    case "WAV":
      return {
        encode: encodeWAV,
        ext: "wav",
        mimeType: "audio/wav",
      }
    case "MP3":
      return {
        encode: encodeMp3,
        ext: "mp3",
        mimeType: "audio/mp3",
      }
  }
}
