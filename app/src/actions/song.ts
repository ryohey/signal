import { emptyTrack, TrackId, UNASSIGNED_TRACK_ID } from "@signal-app/core"
import { useCallback } from "react"
import { useArrangeView } from "../hooks/useArrangeView"
import { useAutoSave } from "../hooks/useAutoSave"
import { useHistory } from "../hooks/useHistory"
import { usePianoRoll, usePianoRollTickScroll } from "../hooks/usePianoRoll"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import { useTrackList } from "../hooks/useTrackList"
import { useTrackMute } from "../hooks/useTrackMute"
import { downloadSongAsMidi } from "../midi/midiConversion"
import Song, { emptySong } from "../song"
import { songFromFile } from "./file"

const openSongFile = async (input: HTMLInputElement): Promise<Song | null> => {
  if (input.files === null || input.files.length === 0) {
    return Promise.resolve(null)
  }

  const file = input.files[0]
  return await songFromFile(file)
}

export const useSetSong = () => {
  const { setSong } = useSong()
  const { clear: clearHistory } = useHistory()
  const { reset: resetTrackMute } = useTrackMute()
  const { stop, reset, setPosition } = usePlayer()
  const { setOpen: setShowTrackList } = useTrackList()
  const {
    setNotGhostTrackIds,
    setSelection,
    setSelectedNoteIds,
    setSelectedTrackId,
  } = usePianoRoll()
  const { setScrollLeftInPixels } = usePianoRollTickScroll()

  const { setSelection: setArrangeSelection } = useArrangeView()

  return useCallback(
    (newSong: Song) => {
      setSong(newSong)
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

      clearHistory()

      stop()
      reset()
      setPosition(0)
    },
    [
      setSong,
      clearHistory,
      resetTrackMute,
      stop,
      reset,
      setPosition,
      setNotGhostTrackIds,
      setScrollLeftInPixels,
      setShowTrackList,
      setSelection,
      setSelectedNoteIds,
      setSelectedTrackId,
      setArrangeSelection,
    ],
  )
}

export const useCreateSong = () => {
  const setSong = useSetSong()
  const { onUserExplicitAction } = useAutoSave()

  return useCallback(() => {
    onUserExplicitAction()
    setSong(emptySong())
  }, [onUserExplicitAction, setSong])
}

export const useSaveSong = () => {
  const { getSong } = useSong()
  const { setSaved } = useSong()
  const { onUserExplicitAction } = useAutoSave()

  return useCallback(() => {
    setSaved(true)
    onUserExplicitAction()
    downloadSongAsMidi(getSong())
  }, [setSaved, onUserExplicitAction, getSong])
}

export const useOpenSong = () => {
  const setSong = useSetSong()
  const { onUserExplicitAction } = useAutoSave()

  return useCallback(
    async (input: HTMLInputElement) => {
      const song = await openSongFile(input)
      if (song === null) {
        return
      }
      onUserExplicitAction()
      setSong(song)
    },
    [setSong, onUserExplicitAction],
  )
}

export const useAddTrack = () => {
  const { addTrack, tracks } = useSong()
  const { pushHistory } = useHistory()

  return useCallback(() => {
    pushHistory()
    addTrack(emptyTrack(Math.min(tracks.length - 1, 0xf)))
  }, [pushHistory, addTrack, tracks])
}

export const useRemoveTrack = () => {
  const {
    selectedTrackIndex: pianoRollSelectedTrackIndex,
    setSelectedTrackIndex,
  } = usePianoRoll()
  const { tracks, removeTrack } = useSong()
  const { pushHistory } = useHistory()
  const {
    selectedTrackIndex: arrangeSelectedTrackIndex,
    setSelectedTrackIndex: setArrangeSelectedTrackIndex,
  } = useArrangeView()

  return useCallback(
    (trackId: TrackId) => {
      const trackCount = tracks.length
      if (tracks.filter((t) => !t.isConductorTrack).length <= 1) {
        // conductor track を除き、最後のトラックの場合
        // トラックがなくなるとエラーが出るので削除できなくする
        // For the last track except for Conductor Track
        // I can not delete it because there is an error when there is no track
        return
      }
      pushHistory()
      removeTrack(trackId)
      const maxTrackIndex = trackCount - 2
      setSelectedTrackIndex(
        Math.min(pianoRollSelectedTrackIndex, maxTrackIndex),
      )
      setArrangeSelectedTrackIndex(
        Math.min(arrangeSelectedTrackIndex, maxTrackIndex),
      )
    },
    [
      tracks,
      pushHistory,
      removeTrack,
      pianoRollSelectedTrackIndex,
      setSelectedTrackIndex,
      arrangeSelectedTrackIndex,
      setArrangeSelectedTrackIndex,
    ],
  )
}

export const useSelectTrack = () => {
  const { setSelectedTrackId } = usePianoRoll()
  return setSelectedTrackId
}

export const useInsertTrack = () => {
  const { insertTrack, tracks } = useSong()
  const { pushHistory } = useHistory()

  return useCallback(
    (trackIndex: number) => {
      pushHistory()
      insertTrack(emptyTrack(tracks.length - 1), trackIndex)
    },
    [pushHistory, insertTrack, tracks],
  )
}

export const useDuplicateTrack = () => {
  const { getTrack, tracks, insertTrack } = useSong()
  const { pushHistory } = useHistory()

  return useCallback(
    (trackId: TrackId) => {
      const track = getTrack(trackId)
      if (track === undefined) {
        throw new Error("No track found")
      }
      const trackIndex = tracks.findIndex((t) => t.id === trackId)
      const newTrack = track.clone()
      newTrack.channel = undefined
      pushHistory()
      insertTrack(newTrack, trackIndex + 1)
    },
    [getTrack, tracks, insertTrack, pushHistory],
  )
}
