import { difference, groupBy, map, range } from "lodash"
import { useCallback, useMemo } from "react"
import { useSetTrackInstrument } from "../actions"
import { InstrumentSetting } from "../components/InstrumentBrowser/InstrumentBrowser"
import { isNotUndefined } from "../helpers/array"
import { getCategoryIndex } from "../midi/GM"
import { programChangeMidiEvent } from "../midi/MidiEvent"
import { useMobxStore } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { usePreviewNote } from "./usePreviewNote"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

export function useInstrumentBrowser() {
  const { pianoRollStore } = useStores()
  const { isPlaying, sendEvent } = usePlayer()
  const setTrackInstrumentAction = useSetTrackInstrument()
  const song = useSong()
  const { previewNoteOn } = usePreviewNote()

  const track = useMobxStore(
    ({ pianoRollStore }) => pianoRollStore.selectedTrack,
  )
  const setting = useMobxStore(
    ({ pianoRollStore }) => pianoRollStore.instrumentBrowserSetting,
  )

  const presetCategories = useMemo(() => {
    const presets = range(0, 128).map((programNumber) => ({
      programNumber,
    }))
    return map(
      groupBy(presets, (p) => getCategoryIndex(p.programNumber)),
      (presets) => ({ presets }),
    )
  }, [])
  const setSetting = useCallback(
    (setting: InstrumentSetting) =>
      (pianoRollStore.instrumentBrowserSetting = setting),
    [pianoRollStore],
  )

  const setOpen = useCallback(
    (open: boolean) => (pianoRollStore.openInstrumentBrowser = open),
    [pianoRollStore],
  )

  const onClickOK = useCallback(() => {
    if (track === undefined) {
      return
    }

    if (setting.isRhythmTrack) {
      track.channel = 9
      setTrackInstrumentAction(track.id, 0)
    } else {
      if (track.isRhythmTrack) {
        // 適当なチャンネルに変える
        const channels = range(16)
        const usedChannels = song.tracks
          .filter((t) => t !== track)
          .map((t) => t.channel)
        const availableChannel =
          Math.min(
            ...difference(channels, usedChannels).filter(isNotUndefined),
          ) || 0
        track.channel = availableChannel
      }
      setTrackInstrumentAction(track.id, setting.programNumber)
    }

    setOpen(false)
  }, [pianoRollStore, setting, setSetting, track, song])

  return {
    setting,
    setSetting,
    get isOpen() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.openInstrumentBrowser,
      )
    },
    setOpen,
    presetCategories,
    onChangeInstrument: useCallback(
      (programNumber: number) => {
        const channel = track?.channel
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
      [setSetting, setting, track, previewNoteOn],
    ),
    onClickOK,
  }
}
