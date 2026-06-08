import { programChangeMidiEvent } from "@signal-app/core"
import { difference, range } from "lodash"
import { useCallback, useMemo } from "react"
import { useInsertTrackInstrument, useSetTrackInstrument } from "../actions"
import type { InstrumentSetting } from "../components/InstrumentBrowser/InstrumentBrowser"
import { usePianoRoll } from "../features/piano-roll/hooks/usePianoRoll"
import { isNotUndefined } from "../helpers/array"
import { getCategoryIndex } from "../midi/GM"
import { usePlayer } from "./usePlayer"
import { usePreviewNote } from "./usePreviewNote"
import { useSong } from "./useSong"
import { useTrack } from "./useTrack"

export function useInstrumentBrowser(
  setting: InstrumentSetting,
  targetEventId?: number,
) {
  const { selectedTrackId } = usePianoRoll()
  const { isRhythmTrack, channel, setChannel } = useTrack(selectedTrackId)
  const { isPlaying, sendEvent } = usePlayer()
  const setTrackInstrumentAction = useSetTrackInstrument(
    selectedTrackId,
    targetEventId,
  )
  const insertTrackInstrumentAction = useInsertTrackInstrument(selectedTrackId)
  const { tracks } = useSong()
  const { previewNoteOn } = usePreviewNote()
  const { position } = usePlayer()

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
      setTrackInstrumentAction(0)
    },
    [
      isRhythmTrack,
      selectedTrackId,
      setChannel,
      tracks,
      setTrackInstrumentAction,
    ],
  )

  const onClickOK = useCallback(() => {
    setTrackInstrumentAction(setting.programNumber)
  }, [setTrackInstrumentAction, setting])

  const selectedCategoryIndex = isRhythmTrack
    ? 0
    : getCategoryIndex(setting.programNumber)

  return {
    selectedCategoryIndex,
    get categoryFirstProgramEvents() {
      return useMemo(() => {
        if (setting.isRhythmTrack) {
          return [0]
        }
        return range(0, 127, 8)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [setting.isRhythmTrack])
    },
    get categoryInstruments() {
      return useMemo(() => {
        if (setting.isRhythmTrack) {
          return [0, 8, 16, 24, 25, 32, 40, 48, 56]
        }
        const offset = selectedCategoryIndex * 8
        return range(offset, offset + 8)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [selectedCategoryIndex, setting.isRhythmTrack])
    },
    changeInstrument: useCallback(
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
      },
      [channel, previewNoteOn, sendEvent, isPlaying, setting],
    ),
    changeRhythmTrack,
    insertInstrumentChangeAtCurrentPosition: useCallback(
      (programNumber: number) => {
        insertTrackInstrumentAction(programNumber, position)
      },
      [insertTrackInstrumentAction, position],
    ),
    onClickOK,
  }
}
