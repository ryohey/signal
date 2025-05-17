import { difference, range } from "lodash"
import { useCallback, useMemo } from "react"
import { useSetTrackInstrument } from "../actions"
import { isNotUndefined } from "../helpers/array"
import { getCategoryIndex } from "../midi/GM"
import { programChangeMidiEvent } from "../midi/MidiEvent"
import { usePianoRoll } from "./usePianoRoll"
import { usePlayer } from "./usePlayer"
import { usePreviewNote } from "./usePreviewNote"
import { useSong } from "./useSong"
import { useTrack } from "./useTrack"

export function useInstrumentBrowser() {
  const {
    selectedTrackId,
    instrumentBrowserSetting: setting,
    setInstrumentBrowserSetting: setSetting,
    setOpenInstrumentBrowser: setOpen,
  } = usePianoRoll()
  const { isRhythmTrack, channel, setChannel } = useTrack(selectedTrackId)
  const { isPlaying, sendEvent } = usePlayer()
  const setTrackInstrumentAction = useSetTrackInstrument(selectedTrackId)
  const { tracks } = useSong()
  const { previewNoteOn } = usePreviewNote()

  const changeRhythmTrack = useCallback(
    (newRhythmTrack: boolean) => {
      if (newRhythmTrack === isRhythmTrack) {
        return
      }
      if (newRhythmTrack) {
        setChannel(9)
      } else {
        if (isRhythmTrack) {
          // 適当なチャンネルに変える
          const channels = range(16)
          const usedChannels = tracks
            .filter((t) => t.id !== selectedTrackId)
            .map((t) => t.channel)
          const availableChannel =
            Math.min(
              ...difference(channels, usedChannels).filter(isNotUndefined),
            ) || 0
          setChannel(availableChannel)
        }
      }
      setSetting({
        programNumber: 0, // reset program number when changing rhythm track
        isRhythmTrack: newRhythmTrack,
      })
      setTrackInstrumentAction(0)
    },
    [isRhythmTrack, selectedTrackId, setChannel, tracks, setSetting],
  )

  const onClickOK = useCallback(() => {
    setTrackInstrumentAction(setting.programNumber)
    setOpen(false)
  }, [changeRhythmTrack, setTrackInstrumentAction, setting, setOpen])

  const selectedCategoryIndex = isRhythmTrack
    ? 0
    : getCategoryIndex(setting.programNumber)

  return {
    setting,
    setSetting,
    get isOpen() {
      return usePianoRoll().openInstrumentBrowser
    },
    setOpen,
    selectedCategoryIndex,
    get categoryFirstProgramEvents() {
      return useMemo(() => {
        if (setting.isRhythmTrack) {
          return [0]
        }
        return range(0, 127, 8)
      }, [setting.isRhythmTrack])
    },
    get categoryInstruments() {
      return useMemo(() => {
        if (setting.isRhythmTrack) {
          return [0, 8, 16, 24, 25, 32, 40, 48, 56]
        }
        const offset = selectedCategoryIndex * 8
        return range(offset, offset + 8)
      }, [selectedCategoryIndex, setting.isRhythmTrack])
    },
    onChangeInstrument: useCallback(
      (programNumber: number) => {
        if (channel === undefined) {
          return
        }
        sendEvent(programChangeMidiEvent(0, channel, programNumber))
        if (!isPlaying) {
          if (setting.isRhythmTrack) {
            previewNoteOn(38, 500)
          } else {
            previewNoteOn(64, 500)
          }
        }
        setSetting({
          programNumber,
          isRhythmTrack: setting.isRhythmTrack,
        })
      },
      [setSetting, setting, channel, previewNoteOn],
    ),
    onChangeRhythmTrack: useCallback(
      (state: boolean) => {
        changeRhythmTrack(state)
      },
      [changeRhythmTrack],
    ),
    onClickOK,
  }
}
