import {
  duplicateTrack as duplicateTrackCmd,
  emptySong,
  insertNewTrack as insertNewTrackCmd,
  Song,
  TrackId,
  UNASSIGNED_TRACK_ID,
} from "@signal-app/core"
import { useCallback } from "react"
import { useArrangeView } from "../features/arrange/hooks/useArrangeView"
import {
  usePianoRoll,
  usePianoRollTickScroll,
} from "../features/piano-roll/hooks/usePianoRoll"
import { useTrackList } from "../features/track-list/hooks/useTrackList"
import { useAutoSave } from "../hooks/useAutoSave"
import { useSongCommand } from "../hooks/useCommand"
import { useHistory } from "../hooks/useHistory"
import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import { useTrackMute } from "../hooks/useTrackMute"
import { downloadSongAsMidi } from "../midi/downloadSongAsMidi"
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
  const { pushHistory } = useHistory()
  const insertNewTrack = useSongCommand(insertNewTrackCmd)

  return useCallback(
    (trackIndex: number) => {
      pushHistory()
      insertNewTrack(trackIndex)
    },
    [pushHistory, insertNewTrack],
  )
}

export const useDuplicateTrack = () => {
  const { pushHistory } = useHistory()
  const duplicateTrack = useSongCommand(duplicateTrackCmd)

  return useCallback(
    (trackId: TrackId) => {
      pushHistory()
      duplicateTrack(trackId)
    },
    [duplicateTrack, pushHistory],
  )
}
