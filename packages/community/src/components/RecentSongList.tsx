import { CloudSong } from "@signal-app/api"
import { useToast } from "dialog-hooks"
import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { useAsyncEffect } from "../hooks/useAsyncEffect.js"
import { useStores } from "../hooks/useStores.js"
import { CircularProgress } from "./CircularProgress.js"
import { SongList } from "./SongList.js"

export const RecentSongList: FC = observer(() => {
  const rootStore = useStores()
  const { communitySongStore, cloudSongRepository } = rootStore
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [songs, setSongs] = useState<CloudSong[]>([])

  useAsyncEffect(async () => {
    try {
      const songs = await cloudSongRepository.getPublicSongs()
      communitySongStore.songs = songs
      setSongs(songs)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <>
        <CircularProgress /> Loading...
      </>
    )
  }

  return <SongList songs={songs} />
})
