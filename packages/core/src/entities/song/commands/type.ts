import { Song } from "../Song"

export type SongCommand<R> = (song: Song) => R
