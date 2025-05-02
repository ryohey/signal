import { renderAudio } from "@signal-app/player"
import { useDialog } from "dialog-hooks"
import { useCallback } from "react"
import { downloadBlob } from "../helpers/Downloader"
import { encodeMp3, encodeWAV } from "../helpers/encodeAudio"
import { useSong } from "../hooks/useSong"
import { useLocalization } from "../localize/useLocalization"
import Song from "../song"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useExport() {
  const { exportStore } = useStores()

  return {
    get openExportProgressDialog() {
      return useMobxStore(
        ({ exportStore }) => exportStore.openExportProgressDialog,
      )
    },
    get progress() {
      return useMobxStore(({ exportStore }) => exportStore.progress)
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
  const { synth, exportStore } = useStores()
  const song = useSong()
  const localized = useLocalization()
  const dialog = useDialog()

  return async (format: "WAV" | "MP3") => {
    song.updateEndOfSong()

    if (!canExport(song)) {
      await dialog.show({
        title: localized["export"],
        message: localized["export-error-too-short"],
        actions: [{ title: "OK", key: "ok" }],
      })
      return
    }

    const soundFontData = synth.loadedSoundFontData
    if (soundFontData === null) {
      return
    }

    const sampleRate = 44100

    exportStore.isCanceled = false
    exportStore.openExportProgressDialog = true
    exportStore.progress = 0

    try {
      const audioBuffer = await renderAudio(
        soundFontData,
        song.allEvents,
        song.timebase,
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
