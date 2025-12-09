import { rectToTriangleBounds, rectToTriangles } from "@ryohey/webgl-react"
import {
  Attrib,
  Shader,
  uniformMat4,
  uniformVec4,
} from "@ryohey/webgl-react/legacy"
import type { vec4 } from "gl-matrix"
import type { Rect } from "../../../../entities/geometry/Rect"

export interface IColorData {
  color: vec4
}

export class NoteBuffer {
  readonly buffers: {
    position: WebGLBuffer
    bounds: WebGLBuffer
    color: WebGLBuffer
  }

  private _vertexCount: number = 0

  constructor(readonly gl: WebGLRenderingContext) {
    this.buffers = {
      position: gl.createBuffer(),
      bounds: gl.createBuffer(),
      color: gl.createBuffer(),
    }
  }

  update(rects: (Rect & IColorData)[]) {
    const { gl } = this
    const positions = rects.flatMap(rectToTriangles)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)

    const bounds = rects.flatMap(rectToTriangleBounds)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.bounds)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bounds), gl.DYNAMIC_DRAW)

    const colors = rects.flatMap((obj) =>
      Array.from(Array(6)).flatMap(() => Array.from(obj.color))
    )
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW)

    this._vertexCount = rects.length * 6
  }

  get vertexCount() {
    return this._vertexCount
  }
}

export const NoteShader = (gl: WebGLRenderingContext) =>
  new Shader(
    gl,
    `
      precision lowp float;
      attribute vec4 aVertexPosition;

      // XYZW -> X, Y, Width, Height
      attribute vec4 aBounds;
      attribute vec4 aColor;

      uniform mat4 uProjectionMatrix;
      varying vec4 vBounds;
      varying vec2 vPosition;
      varying vec4 vColor;

      void main() {
        gl_Position = uProjectionMatrix * aVertexPosition;
        vBounds = aBounds;
        vPosition = aVertexPosition.xy;
        vColor = aColor;
      }
    `,
    `
      precision lowp float;

      uniform vec4 uStrokeColor;
      varying vec4 vBounds;
      varying vec2 vPosition;
      varying vec4 vColor;

      void main() {
        float border = 1.0;
        float localX = vPosition.x - vBounds.x;
        float localY = vPosition.y - vBounds.y;

        if ((localX < border) || (localX >= (vBounds.z - border)) || (localY < border) || (localY > (vBounds.w - border))) {
          // draw outline
          gl_FragColor = uStrokeColor;
        } else {
          gl_FragColor = vColor;
        }
      }
    `,
    (program) => ({
      position: new Attrib(gl, program, "aVertexPosition", 2),
      bounds: new Attrib(gl, program, "aBounds", 4),
      color: new Attrib(gl, program, "aColor", 4),
    }),
    (program) => ({
      projectionMatrix: uniformMat4(gl, program, "uProjectionMatrix"),
      strokeColor: uniformVec4(gl, program, "uStrokeColor"),
    }),
    (gl) => new NoteBuffer(gl)
  )
