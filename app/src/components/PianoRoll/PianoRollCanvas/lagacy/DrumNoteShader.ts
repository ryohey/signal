import {
  Attrib,
  Shader,
  uniformMat4,
  uniformVec4,
} from "@ryohey/webgl-react/legacy"
import { NoteBuffer } from "./NoteShader"

export const DrumNoteShader = (gl: WebGLRenderingContext) =>
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

      uniform vec4 uFillColor;
      uniform vec4 uStrokeColor;

      varying vec4 vBounds;
      varying vec2 vPosition;
      varying vec4 vColor;

      void main() {
        float border = 1.0;
        
        float r = vBounds.w / 2.0;
        vec2 center = vBounds.xy + vBounds.zw / 2.0;
        float len = length(vPosition - center);

        if (len < r - border) {
          gl_FragColor = vColor;
        } else if (len < r) {
          gl_FragColor = uStrokeColor;
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
    (gl) => new NoteBuffer(gl),
  )
