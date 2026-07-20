import { Track } from "../../track"
import { Song } from "../Song"

export type SongCommand<R> = (song: Song) => R
export type SongTracksCommand<R> = (tracks: readonly Track[]) => R
