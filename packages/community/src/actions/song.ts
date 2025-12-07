import type { CloudSong, ICloudSongRepository } from "@signal-app/api"
import { SoundFont, type SoundFontSynth } from "@signal-app/player"
import debounce from "lodash/debounce.js"
import type RootStore from "../stores/RootStore.js"

const debouncedIncrementPlayCount = debounce(
  (cloudSongRepository: ICloudSongRepository, songId: string) =>
    cloudSongRepository.incrementPlayCount(songId),
  5000
)

export const playSong =
  ({ songStore, player, cloudSongRepository, synth }: RootStore) =>
  async (song: CloudSong) => {
    setupSynthIfNeeded(synth)
    await songStore.loadSong(song)
    player.reset()
    player.play()

    try {
      await debouncedIncrementPlayCount(cloudSongRepository, song.id)
    } catch (e) {
      console.error(e)
    }
  }

const playSongAt =
  (indexDelta: number) => (rootStore: RootStore) => async () => {
    const { songStore, communitySongStore } = rootStore
    const currentSong = songStore.currentSong
    if (currentSong === null) {
      return
    }
    const index = communitySongStore.songs.findIndex(
      (s) => s.id === currentSong.metadata.id
    )
    const nextIndex =
      index + indexDelta < 0
        ? communitySongStore.songs.length - 1
        : (index + indexDelta) % communitySongStore.songs.length
    const nextSong = communitySongStore.songs[nextIndex]
    await playSong(rootStore)(nextSong)
  }

export const playPreviousSong = playSongAt(-1)
export const playNextSong = playSongAt(1)

const setupSynthIfNeeded = async (synth: SoundFontSynth) => {
  if (synth.isLoaded) {
    return
  }
  await synth.setup()
  const soundFont = await SoundFont.loadFromURL(
    "https://cdn.jsdelivr.net/gh/ryohey/signal@4569a31/public/A320U.sf2"
  )
  await synth.loadSoundFont(soundFont)
}
