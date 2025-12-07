import { useTheme } from "@emotion/react"
import { type TrackId, trackColorToVec4 } from "@signal-app/core"
import Color from "color"
import { vec4 } from "gl-matrix"
import { colorToVec4 } from "../gl/color"
import { useTrack } from "./useTrack"

interface NoteStyle {
  inactiveColor: vec4
  activeColor: vec4
  selectedColor: vec4
  strokeColor: vec4
}

export const useGhostNoteColor = (trackId: TrackId): NoteStyle => {
  const theme = useTheme()
  const { color } = useTrack(trackId)

  const ghostNoteColor = colorToVec4(Color(theme.ghostNoteColor))
  const transparentColor = vec4.zero(vec4.create())
  const trackColor = color !== undefined ? trackColorToVec4(color) : null
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
