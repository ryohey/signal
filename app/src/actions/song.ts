import { useArrangeView } from "../hooks/useArrangeView"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import { useStores } from "../hooks/useStores"
import { useTrackMute } from "../hooks/useTrackMute"
import { downloadSongAsMidi } from "../midi/midiConversion"
import Song, { emptySong } from "../song"
import { emptyTrack, TrackId, UNASSIGNED_TRACK_ID } from "../track"
import { songFromFile } from "./file"

const openSongFile = async (input: HTMLInputElement): Promise<Song | null> => {
  if (input.files === null || input.files.length === 0) {
    return Promise.resolve(null)
  }

  const file = input.files[0]
  return await songFromFile(file)
}

export const useSetSong = () => {
  const { songStore, historyStore } = useStores()
  const { reset: resetTrackMute } = useTrackMute()
  const { stop, reset, setPosition } = usePlayer()
  const {
    setNotGhostTrackIds,
    setScrollLeftInPixels,
    setShowTrackList,
    setSelection,
    setSelectedNoteIds,
    setSelectedTrackId,
  } = usePianoRoll()

  const {
    setSelection: setArrangeSelection,
    setSelectedEventIds: setArrangeSelectedEventIds,
  } = useArrangeView()

  return (newSong: Song) => {
    songStore.song = newSong
    resetTrackMute()

    setScrollLeftInPixels(0)
    setNotGhostTrackIds(new Set())
    setShowTrackList(true)
    setSelection(null)
    setSelectedNoteIds([])
    setSelectedTrackId(
      newSong.tracks.find((t) => !t.isConductorTrack)?.id ??
        UNASSIGNED_TRACK_ID,
    )

    setArrangeSelection(null)
    setArrangeSelectedEventIds({})

    historyStore.clear()

    stop()
    reset()
    setPosition(0)
  }
}

export const useCreateSong = () => {
  const setSong = useSetSong()
  return () => setSong(emptySong())
}

export const useSaveSong = () => {
  const song = useSong()
  return () => {
    song.isSaved = true
    downloadSongAsMidi(song)
  }
}

export const useOpenSong = () => {
  const setSong = useSetSong()
  return async (input: HTMLInputElement) => {
    const song = await openSongFile(input)
    if (song === null) {
      return
    }
    setSong(song)
  }
}

export const useAddTrack = () => {
  const song = useSong()
  const { pushHistory } = useHistory()

  return () => {
    pushHistory()
    song.addTrack(emptyTrack(Math.min(song.tracks.length - 1, 0xf)))
  }
}

export const useRemoveTrack = () => {
  const {
    selectedTrackIndex: pianoRollSelectedTrackIndex,
    setSelectedTrackIndex,
  } = usePianoRoll()
  const song = useSong()
  const { pushHistory } = useHistory()
  const {
    selectedTrackIndex: arrangeSelectedTrackIndex,
    setSelectedTrackIndex: setArrangeSelectedTrackIndex,
  } = useArrangeView()

  return (trackId: TrackId) => {
    if (song.tracks.filter((t) => !t.isConductorTrack).length <= 1) {
      // conductor track を除き、最後のトラックの場合
      // トラックがなくなるとエラーが出るので削除できなくする
      // For the last track except for Conductor Track
      // I can not delete it because there is an error when there is no track
      return
    }
    pushHistory()
    song.removeTrack(trackId)
    setSelectedTrackIndex(
      Math.min(pianoRollSelectedTrackIndex, song.tracks.length - 1),
    )
    setArrangeSelectedTrackIndex(
      Math.min(arrangeSelectedTrackIndex, song.tracks.length - 1),
    )
  }
}

export const useSelectTrack = () => {
  const { setSelectedTrackId } = usePianoRoll()
  return setSelectedTrackId
}

export const useInsertTrack = () => {
  const song = useSong()
  const { pushHistory } = useHistory()

  return (trackIndex: number) => {
    pushHistory()
    song.insertTrack(emptyTrack(song.tracks.length - 1), trackIndex)
  }
}

export const useDuplicateTrack = () => {
  const song = useSong()
  const { pushHistory } = useHistory()

  return (trackId: TrackId) => {
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
}
