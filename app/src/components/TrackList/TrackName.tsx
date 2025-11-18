import { TrackId } from "@signal-app/core"
import { FC } from "react"
import { useTrack } from "../../hooks/useTrack"
import { Localized } from "../../localize/useLocalization"

// Display the track number if there is no name track name for display
export const TrackName: FC<{ trackId: TrackId }> = ({ trackId }) => {
  const { name, channel } = useTrack(trackId)

  if (name && name.length > 0) {
    return <>{name}</>
  }
  if (channel === undefined) {
    return (
      <>
        <Localized name="conductor-track" />
      </>
    )
  }
  return (
    <>
      <Localized name="track" /> {channel + 1}
    </>
  )
}
