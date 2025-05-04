import { useMobxStore } from "./useMobxSelector"

export const useSong = () => {
  const song = useMobxStore(({ songStore }) => songStore.song)
  return song
}
