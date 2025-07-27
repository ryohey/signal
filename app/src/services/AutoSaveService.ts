import { base64ToUint8Array, uint8ArrayToBase64 } from "../helpers/base64"
import { songFromMidi, songToMidi } from "../midi/midiConversion"
import Song from "../song/Song"
import { SongStore } from "../stores/SongStore"

const AUTO_SAVE_KEY = "signal_autosave"
const AUTO_SAVE_FLAG_KEY = "signal_autosave_flag"
const AUTO_SAVE_INTERVAL = 10000 // auto save every 10 seconds

export interface AutoSaveData {
  midiData: string // base64 encoded MIDI binary data
  timestamp: number
}

export class AutoSaveService {
  private intervalId: NodeJS.Timeout | null = null
  private shouldOfferRestore = false

  constructor(private readonly songStore: SongStore) {
    this.shouldOfferRestore = this.getShouldOfferRestore()
  }

  /**
   * Start periodic auto save
   */
  startAutoSave = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    this.intervalId = setInterval(() => {
      try {
        const song = this.songStore.song
        if (song && !song.isSaved) {
          this.save(song)
        }
      } catch (error) {
        console.warn("Auto save failed:", error)
      }
    }, AUTO_SAVE_INTERVAL)
  }

  /**
   * Stop auto save
   */
  stopAutoSave = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Save song to localStorage
   */
  private save(song: Song) {
    try {
      const midiBytes = songToMidi(song)
      const base64Data = uint8ArrayToBase64(midiBytes)
      const autoSaveData: AutoSaveData = {
        midiData: base64Data,
        timestamp: Date.now(),
      }
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveData))
      console.debug("Auto saved song")
    } catch (error) {
      console.warn("Failed to auto save song:", error)
    }
  }

  /**
   * Check if there is an auto saved song
   */
  hasAutoSavedSong = (): boolean => {
    const data = localStorage.getItem(AUTO_SAVE_KEY)
    return data !== null
  }

  /**
   * Restore auto saved song
   */
  restore = (): Song | null => {
    try {
      const data = localStorage.getItem(AUTO_SAVE_KEY)
      if (!data) {
        return null
      }

      const autoSaveData: AutoSaveData = JSON.parse(data)
      const midiBytes = base64ToUint8Array(autoSaveData.midiData)
      const song = songFromMidi(midiBytes)
      return song
    } catch (error) {
      console.warn("Failed to restore auto saved song:", error)
      return null
    }
  }

  /**
   * Get the last save time of auto saved data
   */
  getLastSaveTime = (): Date | null => {
    try {
      const data = localStorage.getItem(AUTO_SAVE_KEY)
      if (!data) {
        return null
      }

      const autoSaveData: AutoSaveData = JSON.parse(data)
      return new Date(autoSaveData.timestamp)
    } catch {
      return null
    }
  }

  /**
   * Clear auto save data
   */
  clearAutoSave = () => {
    localStorage.removeItem(AUTO_SAVE_KEY)
  }

  /**
   * Get flag indicating whether to offer restore
   */
  getShouldOfferRestore = (): boolean => {
    return localStorage.getItem(AUTO_SAVE_FLAG_KEY) === "true"
  }

  /**
   * Set flag for restore confirmation
   */
  setShouldOfferRestore = (should: boolean) => {
    this.shouldOfferRestore = should
    if (should) {
      localStorage.setItem(AUTO_SAVE_FLAG_KEY, "true")
    } else {
      localStorage.removeItem(AUTO_SAVE_FLAG_KEY)
    }
  }

  /**
   * Called when user performs explicit save/export/upload/discard actions
   * Reset restore flag and clear auto save data
   */
  onUserExplicitAction = () => {
    this.setShouldOfferRestore(false)
    this.clearAutoSave()
  }

  /**
   * Set restore flag when song is changed
   */
  onSongChanged = () => {
    if (!this.shouldOfferRestore) {
      this.setShouldOfferRestore(true)
    }
  }
}
