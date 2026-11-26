import { type Patch, patchMidiEvents, type TrackEventOf, type TrackId } from "@signal-app/core";
import type { PatchTree } from "@signal-app/player";
import { difference, range, sortBy, uniq } from "lodash";
import type { ProgramChangeEvent } from "midifile-ts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isNotUndefined } from "../../../helpers/array";
import { usePlayer } from "../../../hooks/usePlayer";
import { usePreviewNote } from "../../../hooks/usePreviewNote";
import { useSong } from "../../../hooks/useSong";
import { usePatchAt, useTrack } from "../../../hooks/useTrack";
import { getCategoryIndex } from "../../../midi/GM";
import { useLoadedSoundFont } from "../../soundfont/hooks/useSoundFont";
import { useInsertTrackInstrument } from "./useInsertTrackInstrument";
import { useSetTrackInstrument } from "./useSetTrackInstrument";

const defaultPatch: Patch = { programNumber: 0, bankMSB: 0, bankLSB: 0 }

const bank0Only = (programNumbers: number[]) =>
  new Map(programNumbers.map((p) => [p, new Map([[0, [0]]])]))

// Used until a SoundFont is loaded, or when it has no presets of the kind
const gmPatches = bank0Only(range(0, 128))
const gsDrumKitPatches = bank0Only([0, 8, 16, 24, 25, 32, 40, 48, 56])

const getBankMSBs = (patches: PatchTree, programNumber: number) => [
  ...(patches.get(programNumber)?.keys() ?? []),
]

const getBankLSBs = (
  patches: PatchTree,
  programNumber: number,
  bankMSB: number,
) => patches.get(programNumber)?.get(bankMSB) ?? []

// Bank 0 is the usual default, otherwise the first bank that exists
const pickBank = (banks: readonly number[]) =>
  banks.includes(0) ? 0 : (banks[0] ?? 0)

// Mount only while the browser is open: the draft patch is
// initialized from the track (or the target event) on mount.
export function useInstrumentBrowser(
  trackId: TrackId,
  targetEvent?: TrackEventOf<ProgramChangeEvent>,
) {
  const { isRhythmTrack, channel, setChannel, removeProgramChange } =
    useTrack(trackId)
  const { isPlaying, sendEvent, position } = usePlayer()
  const currentPatch = usePatchAt(trackId, targetEvent?.tick ?? position)
  const setTrackInstrumentAction = useSetTrackInstrument(
    trackId,
    targetEvent?.id,
  )
  const insertTrackInstrumentAction = useInsertTrackInstrument(trackId)
  const { tracks, getTrack } = useSong()
  const { previewNoteOn } = usePreviewNote()
  const soundFont = useLoadedSoundFont()

  // Only the patch is a draft until OK.
  // Rhythm track changes are applied to the track immediately.
  // Another program change can share the target's tick, so the program comes
  // from the target itself.
  const [initialPatch] = useState({
    ...currentPatch,
    programNumber: targetEvent?.value ?? currentPatch.programNumber,
  })
  const [initialIsRhythmTrack] = useState(isRhythmTrack)
  const [patch, setPatch] = useState(initialPatch)

  const patches = useMemo(() => {
    const fromSoundFont = isRhythmTrack
      ? soundFont?.drumPatches
      : soundFont?.melodicPatches
    if (fromSoundFont !== undefined && fromSoundFont.size > 0) {
      return fromSoundFont
    }
    return isRhythmTrack ? gsDrumKitPatches : gmPatches
  }, [soundFont, isRhythmTrack])

  // The program the browser opened with is listed even when the SoundFont
  // lacks it, so the list never opens empty with nothing selected
  const programNumbers = useMemo(
    () =>
      sortBy(
        uniq([
          ...patches.keys(),
          ...(isRhythmTrack === initialIsRhythmTrack
            ? [initialPatch.programNumber]
            : []),
        ]),
      ),
    [patches, isRhythmTrack, initialIsRhythmTrack, initialPatch.programNumber],
  )

  // Drum kits have no General MIDI categories, so they share one
  const categoryIndices = useMemo(
    () => (isRhythmTrack ? [0] : uniq(programNumbers.map(getCategoryIndex))),
    [programNumbers, isRhythmTrack],
  )

  const selectedCategoryIndex = isRhythmTrack
    ? 0
    : getCategoryIndex(patch.programNumber)

  const categoryInstruments = useMemo(
    () =>
      isRhythmTrack
        ? programNumbers
        : programNumbers.filter(
            (p) => getCategoryIndex(p) === selectedCategoryIndex,
          ),
    [programNumbers, selectedCategoryIndex, isRhythmTrack],
  )

  // Like the program, the bank the browser opened with is listed even when the
  // SoundFont lacks it, so the bank lists never open with nothing selected
  const isInitialProgram =
    isRhythmTrack === initialIsRhythmTrack &&
    patch.programNumber === initialPatch.programNumber
  const bankMSBs = useMemo(
    () =>
      sortBy(
        uniq([
          ...getBankMSBs(patches, patch.programNumber),
          ...(isInitialProgram ? [initialPatch.bankMSB] : []),
        ]),
      ),
    [patches, patch.programNumber, isInitialProgram, initialPatch.bankMSB],
  )
  const bankLSBs = sortBy(
    uniq([
      ...getBankLSBs(patches, patch.programNumber, patch.bankMSB),
      ...(isInitialProgram && patch.bankMSB === initialPatch.bankMSB
        ? [initialPatch.bankLSB]
        : []),
    ]),
  )

  const hasPreviewed = useRef(false)

  const selectPatch = useCallback(
    (newPatch: Patch) => {
      setPatch(newPatch)
      if (channel === undefined) {
        return
      }
      hasPreviewed.current = true
      patchMidiEvents(0, channel, newPatch).forEach((e) => sendEvent(e))
      if (!isPlaying) {
        previewNoteOn(isRhythmTrack ? 38 : 64, 500)
      }
    },
    [channel, previewNoteOn, sendEvent, isPlaying, isRhythmTrack],
  )

  // The patch that picking a program, or a bank MSB of it, selects. The lists
  // label their entries with it too, so a label names what a click plays (the
  // selected entry is labeled with the current patch, which a click keeps).
  const choosePatch = useCallback(
    (
      programNumber: number,
      bankMSB = pickBank(getBankMSBs(patches, programNumber)),
    ) => ({
      programNumber,
      bankMSB,
      bankLSB: pickBank(getBankLSBs(patches, programNumber, bankMSB)),
    }),
    [patches],
  )

  // Clicking the selected entry again plays it again and keeps the banks
  // chosen below it
  const selectBankMSB = useCallback(
    (bankMSB: number) =>
      selectPatch(
        bankMSB === patch.bankMSB
          ? patch
          : choosePatch(patch.programNumber, bankMSB),
      ),
    [selectPatch, choosePatch, patch],
  )

  const selectBankLSB = useCallback(
    (bankLSB: number) => selectPatch({ ...patch, bankLSB }),
    [selectPatch, patch],
  )

  const selectInstrument = useCallback(
    (programNumber: number) =>
      selectPatch(
        programNumber === patch.programNumber
          ? patch
          : choosePatch(programNumber),
      ),
    [selectPatch, choosePatch, patch],
  )

  // Choose the first instrument of the category
  const selectCategory = useCallback(
    (categoryIndex: number) => {
      // Drum kits share one category whatever their program numbers are
      const programNumber = isRhythmTrack
        ? programNumbers[0]
        : programNumbers.find((p) => getCategoryIndex(p) === categoryIndex)
      if (programNumber !== undefined) {
        selectInstrument(programNumber)
      }
    },
    [programNumbers, selectInstrument, isRhythmTrack],
  )

  // A previewed bank would stay latched on the channel, since songs without
  // bank select never send one, so on close the track's own patch at the
  // playhead goes back to the synth. Before the track's first program change
  // that is the default patch, which is what the channel plays after a reset.
  // The ref holds the latest values, since the cleanup runs on unmount.
  const restoreTrackPatch = useRef(() => {})
  restoreTrackPatch.current = () => {
    const track = getTrack(trackId)
    if (hasPreviewed.current && channel !== undefined && track !== undefined) {
      patchMidiEvents(0, channel, track.getPatch(position)).forEach((e) =>
        sendEvent(e),
      )
    }
  }
  useEffect(() => () => restoreTrackPatch.current(), [])

  const changeRhythmTrack = useCallback(
    (newRhythmTrack: boolean) => {
      if (newRhythmTrack === isRhythmTrack) {
        return
      }
      // The previews went to the channel the track leaves, so it gets the
      // track's patch back now
      restoreTrackPatch.current()
      hasPreviewed.current = false
      if (newRhythmTrack) {
        setChannel(9)
      } else {
        // 適当なチャンネルに変える
        const channels = range(16)
        const usedChannels = tracks
          .filter((t) => t.id !== trackId)
          .map((t) => t.channel)
        const availableChannel =
          Math.min(
            ...difference(channels, usedChannels).filter(isNotUndefined),
          ) || 0
        setChannel(availableChannel)
      }
      setPatch(defaultPatch)
      setTrackInstrumentAction(defaultPatch)
    },
    [isRhythmTrack, trackId, setChannel, tracks, setTrackInstrumentAction],
  )

  const applyInstrument = useCallback(() => {
    setTrackInstrumentAction(patch)
  }, [setTrackInstrumentAction, patch])

  const insertInstrumentAtCurrentPosition = useCallback(() => {
    insertTrackInstrumentAction(patch, position)
  }, [insertTrackInstrumentAction, patch, position])

  const deleteTargetEvent = useCallback(() => {
    if (targetEvent !== undefined) {
      removeProgramChange(targetEvent.id)
    }
  }, [targetEvent, removeProgramChange])

  return {
    patch,
    isRhythmTrack,
    selectedCategoryIndex,
    categoryIndices,
    categoryInstruments,
    // A list only shows up when it has more than one bank to choose from
    bankMSBs: bankMSBs.length > 1 ? bankMSBs : [],
    bankLSBs: bankLSBs.length > 1 ? bankLSBs : [],
    choosePatch,
    selectCategory,
    selectInstrument,
    selectBankMSB,
    selectBankLSB,
    changeRhythmTrack,
    applyInstrument,
    insertInstrumentAtCurrentPosition,
    deleteTargetEvent,
  }
}
