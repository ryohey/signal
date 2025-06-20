import {
  CloudSong,
  ICloudSongRepository,
} from "/imports/signal/packages/api/src"
import { SoundFontSynth } from "/imports/signal/packages/player/src"
import debounce from "lodash/debounce.js"
import RootStore from "../stores/RootStore"

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
  await synth.loadSoundFontFromURL(
    "https://cdn.jsdelivr.net/gh/ryohey/signal@4569a31/public/A320U.sf2"
  )
}
