import { useMobxGetter, useMobxSetter } from "./useMobxSelector"
import { useStores } from "./useStores"

export function usePlayer() {
  const { player } = useStores()

  return {
    get position() {
      return useMobxGetter(player, "position")
    },
    get isPlaying() {
      return useMobxGetter(player, "isPlaying")
    },
    get loop() {
      return useMobxGetter(player, "loop")
    },
    setPosition: useMobxSetter(player, "position"),
    playOrPause: player.playOrPause,
    play: player.play,
    stop: player.stop,
    reset: player.reset,
    sendEvent: player.sendEvent,
    toggleEnableLoop: player.toggleEnableLoop,
    setLoopBegin: player.setLoopBegin,
    setLoopEnd: player.setLoopEnd,
    setCurrentTempo: useMobxSetter(player, "currentTempo"),
    allSoundsOffChannel: player.allSoundsOffChannel,
    allSoundsOffExclude: player.allSoundsOffExclude,
  }
}
