import { CloudSong, User } from "/imports/signal/packages/api/src"
import { basename } from "../helpers/path"
import { useStores } from "../hooks/useStores"
import { songFromMidi, songToMidi } from "../midi/midiConversion"
import Song from "../song"

export const useLoadSong = () => {
  const { cloudSongDataRepository } = useStores()
  return async (cloudSong: CloudSong) => {
    const songData = await cloudSongDataRepository.get(cloudSong.songDataId)
    const song = songFromMidi(songData)
    song.name = cloudSong.name
    song.cloudSongId = cloudSong.id
    song.cloudSongDataId = cloudSong.songDataId
    song.isSaved = true
    return song
  }
}

export const useCreateSong = () => {
  const { cloudSongRepository, cloudSongDataRepository } = useStores()
  return async (song: Song) => {
    const bytes = songToMidi(song)
    const songDataId = await cloudSongDataRepository.create({ data: bytes })
    const songId = await cloudSongRepository.create({
      name: song.name,
      songDataId: songDataId,
    })

    song.cloudSongDataId = songDataId
    song.cloudSongId = songId
    song.isSaved = true
  }
}

export const useUpdateSong = () => {
  const { cloudSongRepository, cloudSongDataRepository } = useStores()
  return async (song: Song) => {
    if (song.cloudSongId === null || song.cloudSongDataId === null) {
      throw new Error("This song is not loaded from the cloud")
    }

    const bytes = songToMidi(song)

    await cloudSongRepository.update(song.cloudSongId, {
      name: song.name,
    })

    await cloudSongDataRepository.update(song.cloudSongDataId, {
      data: bytes,
    })

    song.isSaved = true
  }
}

export const useDeleteSong = () => {
  const { cloudSongRepository, cloudSongDataRepository } = useStores()
  return async (song: CloudSong) => {
    await cloudSongDataRepository.delete(song.songDataId)
    await cloudSongRepository.delete(song.id)
  }
}

export const useLoadSongFromExternalMidiFile = () => {
  const { cloudMidiRepository } = useStores()
  return async (midiFileUrl: string) => {
    const id = await cloudMidiRepository.storeMidiFile(midiFileUrl)
    const data = await cloudMidiRepository.get(id)
    const song = songFromMidi(data)
    song.name = basename(midiFileUrl) ?? ""
    song.isSaved = true
    return song
  }
}

export const usePublishSong = () => {
  const { cloudSongRepository, cloudSongDataRepository } = useStores()
  return async (song: Song, user: User) => {
    if (song.cloudSongId === null || song.cloudSongDataId === null) {
      throw new Error("This song is not saved in the cloud")
    }
    await cloudSongDataRepository.publish(song.cloudSongDataId)
    await cloudSongRepository.publish(song.cloudSongId, user)
  }
}

export const useUnpublishSong = () => {
  const { cloudSongRepository, cloudSongDataRepository } = useStores()
  return async (song: Song) => {
    if (song.cloudSongId === null || song.cloudSongDataId === null) {
      throw new Error("This song is not loaded from the cloud")
    }
    await cloudSongDataRepository.unpublish(song.cloudSongDataId)
    await cloudSongRepository.unpublish(song.cloudSongId)
  }
}
