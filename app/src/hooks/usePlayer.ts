import { useMobxGetter, useMobxSetter } from "./useMobxSelector"
import { useStores } from "./useStores"

export function usePlayer() {
  const { player } = useStores()

  // Call hooks at the top level, not inside getters
  const position = useMobxGetter(player, "position")
  const isPlaying = useMobxGetter(player, "isPlaying")
  const loop = useMobxGetter(player, "loop")

  return {
    position,
    isPlaying,
    loop,
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
