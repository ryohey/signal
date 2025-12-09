import { type Song, songToMidi } from "@signal-app/core"
import { downloadBlob } from "../helpers/Downloader"

export function downloadSongAsMidi(song: Song) {
  const bytes = songToMidi(song)
  const uint8Array = new Uint8Array(bytes)
  const blob = new Blob([uint8Array.buffer], {
    type: "application/octet-stream",
  })
  downloadBlob(blob, song.filepath.length > 0 ? song.filepath : "no name.mid")
}
