import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"
import { songToMidi } from "@signal-app/core"
import { useStores } from "./useStores"
import { renderMidiToAudio, revokeAudioUrl } from "../services/renderService"

// Atoms for HQ render state
const hqRenderIsLoadingAtom = atom<boolean>(false)
const hqRenderAudioUrlAtom = atom<string | null>(null)
const hqRenderErrorAtom = atom<string | null>(null)
const hqRenderIsPlayerOpenAtom = atom<boolean>(false)

export function useHQRender() {
  const { songStore, soundFontStore } = useStores()

  const isLoading = useAtomValue(hqRenderIsLoadingAtom)
  const setIsLoading = useSetAtom(hqRenderIsLoadingAtom)
  const audioUrl = useAtomValue(hqRenderAudioUrlAtom)
  const setAudioUrl = useSetAtom(hqRenderAudioUrlAtom)
  const error = useAtomValue(hqRenderErrorAtom)
  const setError = useSetAtom(hqRenderErrorAtom)
  const isPlayerOpen = useAtomValue(hqRenderIsPlayerOpenAtom)
  const setIsPlayerOpen = useSetAtom(hqRenderIsPlayerOpenAtom)

  const render = useCallback(async () => {
    // Clear previous state
    setError(null)
    setIsLoading(true)

    // Clean up previous audio URL if exists
    if (audioUrl) {
      revokeAudioUrl(audioUrl)
      setAudioUrl(null)
    }

    try {
      // Convert current song to MIDI
      const midiData = songToMidi(songStore.song)

      // Get selected soundfont name
      const selectedId = soundFontStore.selectedSoundFontId
      const selectedFile = soundFontStore.files.find(f => f.id === selectedId)
      const soundfontName = selectedFile?.name

      // Render via backend
      const result = await renderMidiToAudio(midiData, soundfontName)

      // Store the audio URL and open player
      setAudioUrl(result.audioUrl)
      setIsPlayerOpen(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Render failed"
      setError(message)
      console.error("HQ render error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [songStore, soundFontStore, audioUrl, setError, setIsLoading, setAudioUrl, setIsPlayerOpen])

  const closePlayer = useCallback(() => {
    setIsPlayerOpen(false)
  }, [setIsPlayerOpen])

  const clearAudio = useCallback(() => {
    if (audioUrl) {
      revokeAudioUrl(audioUrl)
      setAudioUrl(null)
    }
    setIsPlayerOpen(false)
    setError(null)
  }, [audioUrl, setAudioUrl, setIsPlayerOpen, setError])

  return {
    isLoading,
    audioUrl,
    error,
    isPlayerOpen,
    render,
    closePlayer,
    clearAudio,
  }
}
