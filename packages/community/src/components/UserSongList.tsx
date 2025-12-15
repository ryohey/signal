import { CloudSong } from "@signal-app/api"
import { useToast } from "dialog-hooks"
import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { useAsyncEffect } from "../hooks/useAsyncEffect.js"
import { useStores } from "../hooks/useStores.js"
import { CircularProgress } from "./CircularProgress.js"
import { SongList } from "./SongList.js"

export interface UserSongListProps {
  userId: string
}

export const UserSongList: FC<UserSongListProps> = observer(({ userId }) => {
  const rootStore = useStores()
  const {
    communitySongStore,
    cloudSongRepository,
    authStore: { authUser },
  } = rootStore
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [songs, setSongs] = useState<CloudSong[]>([])

  useAsyncEffect(async () => {
    try {
      let songs: CloudSong[]
      if (userId === authUser?.uid) {
        songs = await cloudSongRepository.getMySongs()
      } else {
        songs = await cloudSongRepository.getPublicSongsByUser(userId)
      }
      communitySongStore.songs = songs
      setSongs(songs)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  if (isLoading) {
    return (
      <>
        <CircularProgress /> Loading...
      </>
    )
  }

  return <SongList songs={songs} />
})
