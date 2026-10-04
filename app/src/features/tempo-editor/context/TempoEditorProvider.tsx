import { createTempoEditor } from "@signal-app/tempo-editor"
import { useStore } from "jotai"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { createBeatsScope } from "../../../hooks/useBeats"
import { createQuantizerScope } from "../../../hooks/useQuantizer"
import { useStores } from "../../../hooks/useStores"
import { createTickScrollScope } from "../../../hooks/useTickScroll"
import {
  TempoEditorContext,
  TempoEditorStoreContext,
} from "../hooks/useTempoEditor"

export function TempoEditorProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const store = useStore()
  const { songStore } = useStores()
  const song = useSyncExternalStore(
    songStore.onSongChanged.subscribe,
    useCallback(() => songStore.song, [songStore]),
  )

  const tempoEditorStore = useMemo(() => {
    // should match the order in TempoEditorScope
    const tickScrollScope = createTickScrollScope(store)
    const quantizerScope = createQuantizerScope(tickScrollScope)
    const beatsScope = createBeatsScope(quantizerScope)
    return {
      tickScrollScope,
      quantizerScope,
      beatsScope,
    }
  }, [store])

  const conductorTrack = song.conductorTrack
  const tempoEditor = useMemo(
    () =>
      conductorTrack !== undefined
        ? createTempoEditor(conductorTrack)
        : undefined,
    [conductorTrack],
  )

  if (tempoEditor === undefined) {
    return <div>No conductor track found</div>
  }

  return (
    <TempoEditorContext.Provider value={tempoEditor}>
      <TempoEditorStoreContext.Provider value={tempoEditorStore}>
        {children}
      </TempoEditorStoreContext.Provider>
    </TempoEditorContext.Provider>
  )
}
