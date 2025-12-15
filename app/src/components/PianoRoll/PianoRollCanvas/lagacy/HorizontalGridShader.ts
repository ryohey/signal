import { rectToTriangles } from "@ryohey/webgl-react"
import {
  Attrib,
  Shader,
  uniformFloat,
  uniformMat4,
  uniformVec4,
} from "@ryohey/webgl-react/legacy"
import { Rect } from "../../../../entities/geometry/Rect"

class HorizontalGridBuffer {
  private gl: WebGLRenderingContext

  readonly buffers: {
    position: WebGLBuffer
  }

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl
    this.buffers = {
      position: gl.createBuffer()!,
    }
  }

  update(rect: Rect) {
    const { gl } = this
    const positions = rectToTriangles(rect)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW)
  }

  get vertexCount() {
    return 6
  }
}

export const HorizontalGridShader = (gl: WebGLRenderingContext) =>
  new Shader(
    gl,
    `
      precision lowp float;
      attribute vec4 aVertexPosition;
      uniform mat4 uProjectionMatrix;
      varying vec4 vPosition;

      void main() {
        gl_Position = uProjectionMatrix * aVertexPosition;
        vPosition = aVertexPosition;
      }
    `,
    `
      precision lowp float;
      uniform vec4 uColor;
      uniform vec4 uHighlightedColor;
      uniform vec4 uBlackLaneColor;
      uniform float uHeight;
      varying vec4 vPosition;

      float step2(float x) {
        return step(0.0, x) * step(x, 1.0);
      }
      
      void main() {
        const float eps = 0.1;
        float y = vPosition.y;
        float border = 1.0;
        float index = 128.0 - y / uHeight;
        float key = mod(index, 12.0);

        // draw border
        if (abs(key) < eps || abs(key - 5.0) < eps) {
          vec4 color = mix(uHighlightedColor, uColor, step(0.1, key));
          gl_FragColor = step(fract(index) * uHeight, border) * color;
        }

        // draw black lane
        gl_FragColor += (
          step2(key - 1.0) + 
          step2(key - 3.0) + 
          step2(key - 6.0) + 
          step2(key - 8.0) + 
          step2(key - 10.0)
        ) * uBlackLaneColor;
      }
    `,
    (program) => ({
      position: new Attrib(gl, program, "aVertexPosition", 2),
    }),
    (program) => ({
      projectionMatrix: uniformMat4(gl, program, "uProjectionMatrix"),
      color: uniformVec4(gl, program, "uColor"),
      highlightedColor: uniformVec4(gl, program, "uHighlightedColor"),
      blackLaneColor: uniformVec4(gl, program, "uBlackLaneColor"),
      height: uniformFloat(gl, program, "uHeight"),
    }),
    (gl) => new HorizontalGridBuffer(gl),
  )
