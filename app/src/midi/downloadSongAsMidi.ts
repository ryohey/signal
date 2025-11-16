import { Song, songToMidi } from "@signal-app/core"
import { downloadBlob } from "../helpers/Downloader"

export function downloadSongAsMidi(song: Song) {
  const bytes = songToMidi(song)
  const blob = new Blob([bytes], { type: "application/octet-stream" })
  downloadBlob(blob, song.filepath.length > 0 ? song.filepath : "no name.mid")
}