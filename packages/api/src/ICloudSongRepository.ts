import type { User } from "./IUserRepository.js"

export interface CloudSong {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  songDataId: string
  userId: string
  publishedAt?: Date
  isPublic?: boolean
  user?: User
  playCount?: number
}

export interface ICloudSongRepository {
  get(id: string): Promise<CloudSong | null>
  create(data: Pick<CloudSong, "name" | "songDataId">): Promise<string>
  update(songId: string, data: Pick<CloudSong, "name">): Promise<void>
  delete(songId: string): Promise<void>
  publish(songId: string, user: User): Promise<void>
  unpublish(songId: string): Promise<void>
  incrementPlayCount(songId: string): Promise<void>
  getMySongs(): Promise<CloudSong[]>
  getPublicSongs(): Promise<CloudSong[]>
  getPublicSongsByUser(userId: string): Promise<CloudSong[]>
}
