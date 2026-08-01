import { LoopSetting } from "@signal-app/player"
import { useCallback, useSyncExternalStore } from "react"
import { useStores } from "./useStores"

export function usePlayer() {
  const { player } = useStores()

  return {
    get position() {
      return useSyncExternalStore(
        player.onPositionChanged.subscribe,
        useCallback(() => player.position, [player]),
      )
    },
    get isPlaying() {
      return useSyncExternalStore(
        player.onIsPlayingChanged.subscribe,
        useCallback(() => player.isPlaying, [player]),
      )
    },
    get loop() {
      return useSyncExternalStore(
        player.onLoopChanged.subscribe,
        useCallback(() => player.loop, [player]),
      )
    },
    setPosition: useCallback(
      (tick: number) => {
        player.position = tick
      },
      [player],
    ),
    playOrPause: player.playOrPause,
    play: player.play,
    stop: player.stop,
    reset: player.reset,
    setLoop: useCallback(
      (loop: LoopSetting | null) => {
        player.loop = loop
      },
      [player],
    ),
    sendEvent: player.sendEvent,
    toggleEnableLoop: player.toggleEnableLoop,
    setLoopBegin: player.setLoopBegin,
    setLoopEnd: player.setLoopEnd,
    setCurrentTempo: useCallback(
      (tempo: number) => {
        player.currentTempo = tempo
      },
      [player],
    ),
    allSoundsOff: player.allSoundsOff,
    allSoundsOffChannel: player.allSoundsOffChannel,
    allSoundsOffExclude: player.allSoundsOffExclude,
  }
}
