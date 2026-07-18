import { useSong } from "./useSong"
import { useTrackEvents } from "./useTrack"

export function useConductorTrack() {
  const { conductorTrack } = useSong()
  return useTrackEvents(conductorTrack)
}
