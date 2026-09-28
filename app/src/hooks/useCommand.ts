import { SongCommand } from "@signal-app/core"
import { useCallback } from "react"
import { useStores } from "./useStores"

export function useSongCommand<A extends unknown[], R>(
  cmd: (...a: A) => SongCommand<R>,
): (...a: A) => R {
  const { songStore } = useStores()
  return useCallback((...a: A) => cmd(...a)(songStore.song), [songStore, cmd])
}
