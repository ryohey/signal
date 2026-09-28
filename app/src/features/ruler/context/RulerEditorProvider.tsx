import { createRulerEditor } from "@signal-app/ruler-editor"
import {
  FC,
  ReactNode,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react"
import { useStores } from "../../../hooks/useStores"
import { RulerEditorContext } from "../hooks/useRulerEditor"

export const RulerEditorProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { songStore } = useStores()
  const song = useSyncExternalStore(
    songStore.onSongChanged.subscribe,
    useCallback(() => songStore.song, [songStore]),
  )
  const conductorTrack = useSyncExternalStore(
    song.onConductorTrackChanged.subscribe,
    useCallback(() => song.conductorTrack, [song]),
  )
  const rulerEditor = useMemo(
    () => (conductorTrack ? createRulerEditor(song, conductorTrack) : null),
    [song, conductorTrack],
  )

  if (!rulerEditor) {
    return null
  }

  return (
    <RulerEditorContext.Provider value={rulerEditor}>
      {children}
    </RulerEditorContext.Provider>
  )
}
