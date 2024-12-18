import { downloadSongAsMidi } from "../midi/midiConversion"
import Song, { emptySong } from "../song"
import RootStore from "../stores/RootStore"
import { emptyTrack, TrackId, UNASSIGNED_TRACK_ID } from "../track"
import { songFromFile } from "./file"

const openSongFile = async (input: HTMLInputElement): Promise<Song | null> => {
  if (input.files === null || input.files.length === 0) {
    return Promise.resolve(null)
  }

  const file = input.files[0]
  return await songFromFile(file)
}

export const setSong = (rootStore: RootStore) => (song: Song) => {
  const { trackMute, pianoRollStore, player, historyStore, arrangeViewStore } =
    rootStore
  rootStore.song = song
  trackMute.reset()

  pianoRollStore.setScrollLeftInPixels(0)
  pianoRollStore.notGhostTrackIds = new Set()
  pianoRollStore.showTrackList = true
  pianoRollStore.selection = null
  pianoRollStore.selectedNoteIds = []
  pianoRollStore.selectedTrackId =
    song.tracks.find((t) => !t.isConductorTrack)?.id ?? UNASSIGNED_TRACK_ID

  arrangeViewStore.selection = null
  arrangeViewStore.selectedEventIds = []

  historyStore.clear()

  player.stop()
  player.reset()
  player.position = 0
}

export const createSong = (rootStore: RootStore) => () => {
  const store = rootStore
  setSong(store)(emptySong())
}

export const saveSong = (rootStore: RootStore) => () => {
  const { song } = rootStore
  song.isSaved = true
  downloadSongAsMidi(song)
}

export const openSong =
  (rootStore: RootStore) => async (input: HTMLInputElement) => {
    const song = await openSongFile(input)
    if (song === null) {
      return
    }
    setSong(rootStore)(song)
  }

export const addTrack =
  ({ song, pushHistory }: RootStore) =>
  () => {
    pushHistory()
    song.addTrack(emptyTrack(Math.min(song.tracks.length - 1, 0xf)))
  }

export const removeTrack =
  ({ song, pianoRollStore, arrangeViewStore, pushHistory }: RootStore) =>
  (trackId: TrackId) => {
    if (song.tracks.filter((t) => !t.isConductorTrack).length <= 1) {
      // conductor track を除き、最後のトラックの場合
      // トラックがなくなるとエラーが出るので削除できなくする
      // For the last track except for Conductor Track
      // I can not delete it because there is an error when there is no track
      return
    }
    pushHistory()
    const pianoRollSelectedTrackIndex = pianoRollStore.selectedTrackIndex
    const arrangeViewSelectedTrackIndex = arrangeViewStore.selectedTrackIndex
    song.removeTrack(trackId)
    pianoRollStore.selectedTrackIndex = Math.min(
      pianoRollSelectedTrackIndex,
      song.tracks.length - 1,
    )
    arrangeViewStore.selectedTrackIndex = Math.min(
      arrangeViewSelectedTrackIndex,
      song.tracks.length - 1,
    )
  }

export const selectTrack =
  ({ pianoRollStore }: RootStore) =>
  (trackId: TrackId) => {
    pianoRollStore.selectedTrackId = trackId
  }

export const insertTrack =
  ({ song, pushHistory }: RootStore) =>
  (trackIndex: number) => {
    pushHistory()
    song.insertTrack(emptyTrack(song.tracks.length - 1), trackIndex)
  }

export const duplicateTrack =
  ({ song, pushHistory }: RootStore) =>
  (trackId: TrackId) => {
    const track = song.getTrack(trackId)
    if (track === undefined) {
      throw new Error("No track found")
    }
    const trackIndex = song.tracks.findIndex((t) => t.id === trackId)
    const newTrack = track.clone()
    newTrack.channel = undefined
    pushHistory()
    song.insertTrack(newTrack, trackIndex + 1)
  }
