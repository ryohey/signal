import styled from "@emotion/styled"
import { FC } from "react"
import { useTrackList } from "../../hooks/useTrackList"
import { DraggableList } from "../DraggableList/DraggableList"
import { AddTrackButton } from "./AddTrackButton"
import { TrackListItem } from "./TrackListItem"

const List = styled.div`
  overflow-y: auto;
  background: var(--color-background);
  min-width: 14rem;
  flex-grow: 1;
`

export const TrackList: FC = () => {
  const { moveTrack, trackIds } = useTrackList()

  return (
    <List>
      <DraggableList
        items={trackIds}
        getItemId={(trackId) => trackId}
        onItemMoved={moveTrack}
        render={(trackId) => <TrackListItem key={trackId} trackId={trackId} />}
      ></DraggableList>
      <AddTrackButton />
    </List>
  )
}
