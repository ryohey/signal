import { UNASSIGNED_TRACK_ID } from "@signal-app/core"
import { createPianoRollEditor } from "@signal-app/pianoroll-editor"
import { useAtom, useStore } from "jotai"
import { useEffect, useMemo } from "react"
import { createBeatsScope } from "../../../hooks/useBeats"
import { createQuantizerScope } from "../../../hooks/useQuantizer"
import { useSong } from "../../../hooks/useSong"
import { useStores } from "../../../hooks/useStores"
import { createTickScrollScope } from "../../../hooks/useTickScroll"
import {
  PianoRollStoreContext,
  resetSelectionEffectAtom,
  usePianoRoll,
} from "../hooks/usePianoRoll"
import { PianoRollEditorProvider } from "../hooks/usePianoRollEditor"

export function PianoRollProvider({ children }: { children: React.ReactNode }) {
  const store = useStore()

  const pianoRollStore = useMemo(() => {
    // should match the order in PianoRollScope
    const tickScrollScope = createTickScrollScope(store)
    const quantizerScope = createQuantizerScope(tickScrollScope)
    const beatsScope = createBeatsScope(quantizerScope)
    return {
      quantizerScope,
      tickScrollScope,
      beatsScope,
    }
  }, [store])

  return (
    <PianoRollStoreContext.Provider value={pianoRollStore}>
      <PianoRollProviderInner>{children}</PianoRollProviderInner>
    </PianoRollStoreContext.Provider>
  )
}

function PianoRollProviderInner({ children }: { children: React.ReactNode }) {
  const { songStore, midiMonitor, midiRecorder } = useStores()
  const store = useStore()
  const { selectedTrackId, setSelectedTrackId } = usePianoRoll()
  const { tracks } = useSong()

  const selectedTrack = useMemo(
    () => tracks.find((t) => t.id === selectedTrackId),
    [selectedTrackId, tracks],
  )

  const pianoRollEditor = useMemo(
    () =>
      selectedTrack && createPianoRollEditor(songStore.song, selectedTrack.id),
    [songStore, selectedTrack],
  )

  useAtom(resetSelectionEffectAtom, { store })

  // Initially select the first track that is not a conductor track
  useEffect(() => {
    setSelectedTrackId(
      songStore.song.tracks.find((t) => !t.isConductorTrack)?.id ??
        UNASSIGNED_TRACK_ID,
    )
  }, [setSelectedTrackId, songStore])

  // sync MIDIMonitor channel with selected track
  useEffect(
    () =>
      selectedTrack?.onChannelChanged.subscribe(() => {
        midiMonitor.channel = selectedTrack?.channel ?? 0
      }),
    [midiMonitor, selectedTrack],
  )

  // sync MIDIRecorder trackId with selected track
  useEffect(() => {
    midiRecorder.trackId = selectedTrackId ?? UNASSIGNED_TRACK_ID
  }, [midiRecorder, selectedTrackId])

  if (pianoRollEditor === undefined) {
    return null
  }

  return (
    <PianoRollEditorProvider value={pianoRollEditor}>
      {children}
    </PianoRollEditorProvider>
  )
}
