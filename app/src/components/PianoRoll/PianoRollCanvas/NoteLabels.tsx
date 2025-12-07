import { useTheme } from "@emotion/react"
import { GLNode, useRenderer, useTransform } from "@ryohey/webgl-react"
import Color from "color"
import { FC, useEffect, useMemo, useState } from "react"
import fontAtlas from "../../../assets/font-atlas.png"
import { Rect } from "../../../entities/geometry/Rect"
import { colorToVec4 } from "../../../gl/color"
import { INoteLabelData, NoteLabelShader } from "./shaders/NoteLabelShader"

export interface NoteLabelProps {
  rects: (Rect & INoteLabelData)[]
  zIndex?: number
}

export const NoteLabels: FC<NoteLabelProps> = ({ rects, zIndex }) => {
  const renderer = useRenderer()
  const [texture, setTexture] = useState<WebGLTexture | null>(null)
  const projectionMatrix = useTransform()

  useEffect(() => {
    const gl = renderer.gl

    if (texture || !gl || !(gl instanceof WebGL2RenderingContext)) {
      return
    }

    const loadTexture = async () => {
      const texture = await createTexture(gl, fontAtlas)
      setTexture(texture)
    }
    loadTexture()
    return () => {
      if (texture) {
        gl.deleteTexture(texture)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderer.gl])

  const theme = useTheme()
  const color = useMemo(
    () => colorToVec4(Color(theme.onSurfaceColor)),
    [theme.onSurfaceColor],
  )
  const selectedColor = useMemo(
    () =>
      theme.isLightContent
        ? colorToVec4(Color(theme.backgroundColor))
        : colorToVec4(Color(theme.textColor)),
    [theme.textColor, theme.backgroundColor, theme.isLightContent],
  )

  return (
    <GLNode
      shader={NoteLabelShader}
      buffer={rects}
      zIndex={zIndex}
      uniforms={{
        u_font: texture,
        projectionMatrix,
        color,
        selectedColor,
      }}
    />
  )
}

async function createTexture(gl: WebGL2RenderingContext, src: string) {
  const image = new Image()
  image.src = src
  await image.decode()

  const texture = gl.createTexture()
  if (!texture) {
    throw new Error("Failed to create texture")
  }

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  )

  return texture
}
