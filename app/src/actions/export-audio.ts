
import Song from "../song"
import RootStore from "../stores/RootStore"
import exportMp3 from "./export/export-mp3"
import { exportWav } from "./export/export-wav"


export const cancelExport = ({ exportStore }: RootStore) =>
  () => {
    exportStore.isCanceled = true
  }

export const exportSong =
  (rootStore: RootStore) =>
    () => {
      const { exportMode } = rootStore.exportStore
      if (exportMode === "WAV") {
        exportWav(rootStore)()
      } else if (exportMode === "MP3") {
        exportMp3(rootStore)()
      }
    }

export const canExport = (song: Song) =>
  song.allEvents.some((e) => e.tick >= 120)
