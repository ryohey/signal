import { difference, groupBy, map, range } from "lodash"
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
  const setTrackInstrumentAction = useSetTrackInstrument()
  const song = useSong()
  const { previewNoteOn } = usePreviewNote()

  const onClickOK = useCallback(() => {
    if (setting.isRhythmTrack) {
      setChannel(9)
      setTrackInstrumentAction(selectedTrackId, 0)
    } else {
      if (isRhythmTrack) {
        // 適当なチャンネルに変える
        const channels = range(16)
        const usedChannels = song.tracks
          .filter((t) => t.id !== selectedTrackId)
          .map((t) => t.channel)
        const availableChannel =
          Math.min(
            ...difference(channels, usedChannels).filter(isNotUndefined),
          ) || 0
        setChannel(availableChannel)
      }
      setTrackInstrumentAction(selectedTrackId, setting.programNumber)
    }

    setOpen(false)
  }, [
    setting,
    setSetting,
    selectedTrackId,
    setChannel,
    isRhythmTrack,
    song,
    setOpen,
    setTrackInstrumentAction,
  ])

  return {
    setting,
    setSetting,
    get isOpen() {
      return usePianoRoll().openInstrumentBrowser
    },
    setOpen,
    get presetCategories() {
      return useMemo(() => {
        const presets = range(0, 128).map((programNumber) => ({
          programNumber,
        }))
        return map(
          groupBy(presets, (p) => getCategoryIndex(p.programNumber)),
          (presets) => ({ presets }),
        )
      }, [])
    },
    onChangeInstrument: useCallback(
      (programNumber: number) => {
        if (channel === undefined) {
          return
        }
        sendEvent(programChangeMidiEvent(0, channel, programNumber))
        if (!isPlaying) {
          previewNoteOn(64, 500)
        }
        setSetting({
          programNumber,
          isRhythmTrack: setting.isRhythmTrack,
        })
      },
      [setSetting, setting, channel, previewNoteOn],
    ),
    onClickOK,
  }
}
