
import { useStores } from "../../hooks/useStores"
import Song from "../../song"
import RootStore from "../../stores/RootStore"
import exportMp3 from "./export-mp3"
import { exportWav } from "./export-wav"


export const useCancelExport = () => {
  const { exportStore } = useStores()

  return () => {
    exportStore.isCanceled = true
  }
}

export const exportSong =
  (rootStore: RootStore) =>
    () => {
      switch (rootStore.exportStore.exportMode) {
        case "WAV":
          exportWav(rootStore)();
          break;
        case "MP3":
          exportMp3(rootStore)()
          break;
      }
    }

export const canExport = (song: Song) =>
  song.allEvents.some((e) => e.tick >= 120)
