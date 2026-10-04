import { useCallback, useSyncExternalStore } from "react"
import { useStores } from "./useStores.js"

export function useIsPlaying() {
  const { player } = useStores()
  return useSyncExternalStore(
    player.onIsPlayingChanged.subscribe,
    useCallback(() => player.isPlaying, [player]),
  )
}
