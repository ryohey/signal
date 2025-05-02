import { observer } from "mobx-react-lite"
import { FC } from "react"
import { Helmet } from "react-helmet-async"
import { useSong } from "../../hooks/useSong"
import Song from "../../song"

// we still need to use observer to track song property changes
export const Head: FC = observer(() => {
  const song = useSong()

  return (
    <Helmet>
      <title>
        {getSongDisplayName(song)}
        {song.isSaved ? "" : " *"}
        {" - signal"}
      </title>
    </Helmet>
  )
})

function getSongDisplayName(song: Song): string {
  if (song.filepath.length > 0) {
    return song.filepath
  }
  if (song.name.length > 0) {
    return song.name
  }
  return "New song"
}
