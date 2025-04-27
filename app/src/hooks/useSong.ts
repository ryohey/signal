import { useMobxStore } from "./useMobxSelector"

export const useSong = () => {
  const song = useMobxStore(({ song }) => song)
  return song
}
