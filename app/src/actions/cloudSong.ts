import type { CloudSong } from "@signal-app/api"
import { type Song, songFromMidi, songToMidi } from "@signal-app/core"
import { basename } from "../helpers/path"
import { useAutoSave } from "../hooks/useAutoSave"
import {
  cloudMidiRepository,
  cloudSongDataRepository,
  cloudSongRepository,
  userRepository,
} from "../services/repositories"

export const useLoadSong = () => {
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
  const { onUserExplicitAction } = useAutoSave()

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
    onUserExplicitAction()
  }
}

export const useUpdateSong = () => {
  const { onUserExplicitAction } = useAutoSave()

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
    onUserExplicitAction()
  }
}

export const useDeleteSong = () => {
  return async (song: CloudSong) => {
    await cloudSongDataRepository.delete(song.songDataId)
    await cloudSongRepository.delete(song.id)
  }
}

export const useLoadSongFromExternalMidiFile = () => {
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
  return async (song: Song) => {
    const user = await userRepository.getCurrentUser()
    if (user === null) {
      throw new Error("Failed to get current user, please re-sign in")
    }
    if (song.cloudSongId === null || song.cloudSongDataId === null) {
      throw new Error("This song is not saved in the cloud")
    }
    await cloudSongDataRepository.publish(song.cloudSongDataId)
    await cloudSongRepository.publish(song.cloudSongId, user)
  }
}

export const useUnpublishSong = () => {
  return async (song: Song) => {
    if (song.cloudSongId === null || song.cloudSongDataId === null) {
      throw new Error("This song is not loaded from the cloud")
    }
    await cloudSongDataRepository.unpublish(song.cloudSongDataId)
    await cloudSongRepository.unpublish(song.cloudSongId)
  }
}
