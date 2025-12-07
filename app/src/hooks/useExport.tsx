import type { Song } from "@signal-app/core"
import { renderAudio } from "@signal-app/player"
import { useDialog } from "dialog-hooks"
import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { downloadBlob } from "../helpers/Downloader"
import { encodeMp3, encodeWAV } from "../helpers/encodeAudio"
import { useLocalization } from "../localize/useLocalization"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

export function useExport() {
  return {
    get openExportProgressDialog() {
      return useAtomValue(openExportProgressDialogAtom)
    },
    get progress() {
      return useAtomValue(progressAtom)
    },
    get exportSong() {
      return useExportSong()
    },
    setOpenExportProgressDialog: useSetAtom(openExportProgressDialogAtom),
    cancelExport: useSetAtom(cancelExportAtom),
  }
}

// atoms
const openExportProgressDialogAtom = atom<boolean>(false)
const progressAtom = atom<number>(0)
const isCanceledAtom = atom<boolean>(false)

// actions
const cancelExportAtom = atom(null, (_get, set) => {
  set(isCanceledAtom, true)
})

const waitForAnimationFrame = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()))

const useExportSong = () => {
  const { synth } = useStores()
  const { updateEndOfSong, getSong, timebase } = useSong()
  const localized = useLocalization()
  const dialog = useDialog()
  const setOpenDialog = useSetAtom(openExportProgressDialogAtom)
  const setProgress = useSetAtom(progressAtom)
  const setCanceled = useSetAtom(isCanceledAtom)
  const store = useStore()

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

    setCanceled(false)
    setOpenDialog(true)
    setProgress(0)

    try {
      const audioBuffer = await renderAudio(
        soundFontData,
        getSong().allEvents as any,
        timebase,
        sampleRate,
        {
          bufferSize: 128,
          cancel: () => store.get(isCanceledAtom),
          waitForEventLoop: waitForAnimationFrame,
          onProgress: (numFrames, totalFrames) =>
            setProgress(numFrames / totalFrames),
        }
      )

      setProgress(1)

      const encoder = getEncoder(format)
      const audioData = await encoder.encode(audioBuffer)

      const blob = new Blob([audioData as any], { type: encoder.mimeType })
      setOpenDialog(false)
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
