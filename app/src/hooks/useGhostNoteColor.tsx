import { useTheme } from "@emotion/react"
import Color from "color"
import { vec4 } from "gl-matrix"
import { colorToVec4 } from "../gl/color"
import { TrackId } from "../track"
import { trackColorToVec4 } from "../track/TrackColor"
import { useMobxSelector } from "./useMobxSelector"
import { useStores } from "./useStores"

interface NoteStyle {
  inactiveColor: vec4
  activeColor: vec4
  selectedColor: vec4
  strokeColor: vec4
}

export const useGhostNoteColor = (trackId: TrackId): NoteStyle => {
  const { song } = useStores()
  const theme = useTheme()
  const track = useMobxSelector(() => song.getTrack(trackId))

  if (track === undefined) {
    return {
      inactiveColor: vec4.create(),
      activeColor: vec4.create(),
      selectedColor: vec4.create(),
      strokeColor: vec4.create(),
    }
  }

  const ghostNoteColor = colorToVec4(Color(theme.ghostNoteColor))
  const transparentColor = vec4.zero(vec4.create())
  const trackColor =
    track.color !== undefined ? trackColorToVec4(track.color) : null
  const ghostedColor =
    trackColor !== null
      ? vec4.lerp(vec4.create(), trackColor, ghostNoteColor, 0.7)
      : ghostNoteColor

  return {
    inactiveColor: transparentColor,
    activeColor: ghostedColor,
    selectedColor: ghostedColor,
    strokeColor: transparentColor,
  }
}
