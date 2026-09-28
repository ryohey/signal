import { createArrangeEditor } from "@signal-app/arrange-editor"
import {
  type FC,
  type ReactNode,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react"
import { useStores } from "../../../hooks/useStores"
import { ArrangeEditorContext } from "../hooks/useArrangeEditor"

export const ArrangeEditorProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { songStore } = useStores()
  const song = useSyncExternalStore(
    songStore.onSongChanged.subscribe,
    useCallback(() => songStore.song, [songStore]),
  )

  const arrangeEditor = useMemo(() => createArrangeEditor(song), [song])

  return (
    <ArrangeEditorContext.Provider value={arrangeEditor}>
      {children}
    </ArrangeEditorContext.Provider>
  )
}
