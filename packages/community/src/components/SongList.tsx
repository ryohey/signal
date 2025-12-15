import { CloudSong } from "@signal-app/api"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { SongListItem } from "./SongListItem.js"

export interface SongListProps {
  songs: CloudSong[]
}

export const SongList: FC<SongListProps> = observer(({ songs }) => {
  if (songs.length === 0) {
    return <div>No songs</div>
  }

  return (
    <>
      {songs.map((song) => (
        <SongListItem key={song.id} song={song} />
      ))}
    </>
  )
})
