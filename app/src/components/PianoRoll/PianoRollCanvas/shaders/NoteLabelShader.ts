import {
  type InstancedBuffer,
  rectToTriangles,
  Shader,
  uniformMat4,
  uniformVec4,
  type VertexArray,
} from "@ryohey/webgl-react"
import type { Rect } from "../../../../entities/geometry/Rect"

export interface INoteLabelData {
  velocity: number // 0-127
  noteNumber: number // 0-127
  isSelected: boolean // Switch color if selected
}

export class NoteLabelBuffer
  implements
    InstancedBuffer<
      (Rect & INoteLabelData)[],
      "position" | "bounds" | "a_noteNumber" | "state"
    >
{
  private _instanceCount = 0
  private bounds = new Float32Array(0)
  private noteNumbers = new Float32Array(0)
  private state = new Float32Array(0)

  constructor(
    readonly vertexArray: VertexArray<
      "position" | "bounds" | "a_noteNumber" | "state"
    >
  ) {
    this.vertexArray.updateBuffer(
      "position",
      new Float32Array(rectToTriangles({ x: 0, y: 0, width: 1, height: 1 }))
    )
  }

  update(rects: (Rect & INoteLabelData)[]) {
    if (this.bounds.length < rects.length * 4)
      this.bounds = new Float32Array(rects.length * 4)
    if (this.noteNumbers.length < rects.length)
      this.noteNumbers = new Float32Array(rects.length)
    if (this.state.length < rects.length * 2)
      this.state = new Float32Array(rects.length * 2)

    for (let i = 0; i < rects.length; i++) {
      const r = rects[i]
      this.bounds.set([r.x, r.y, r.width, r.height], i * 4)
      this.noteNumbers[i] = r.noteNumber
      this.state[i * 2] = r.velocity / 127
      this.state[i * 2 + 1] = r.isSelected ? 1 : 0
    }

    this.vertexArray.updateBuffer(
      "bounds",
      this.bounds.subarray(0, rects.length * 4)
    )
    this.vertexArray.updateBuffer(
      "a_noteNumber",
      this.noteNumbers.subarray(0, rects.length)
    )
    this.vertexArray.updateBuffer(
      "state",
      this.state.subarray(0, rects.length * 2)
    )
    this._instanceCount = rects.length
  }

  get vertexCount() {
    return 6
  }

  get instanceCount() {
    return this._instanceCount
  }
}

export const NoteLabelShader = (gl: WebGL2RenderingContext) =>
  new Shader(
    gl,
    `#version 300 es
      precision highp float;

      in float a_noteNumber;
      in vec4 position;
      in vec4 bounds; // x, y, width, height
      in vec2 state; // [velocity, isSelected]

      uniform mat4 projectionMatrix;

      out vec2 v_uv;
      out vec2 v_state;
      out float v_drawX;
      out float v_clipBoundsR;

      void main() {
        const float scale = 0.7;
        const float border = 1.0;
        const float atlasCols = 16.0;
        const float atlasRows = 8.0;
        // Calculate label size (3 glyphs width, scaled)
        vec2 size = vec2(bounds.w * 3.0, bounds.w) * scale;
        // Center vertically, add border offset
        vec2 offset = vec2(border, border + (bounds.w - size.y) * 0.5);
        vec2 labelPos = position.xy * size + bounds.xy + offset;
        vec4 transformedPosition = vec4(labelPos, position.zw);
        gl_Position = projectionMatrix * transformedPosition;

        // Calculate clip bounds
        vec2 rectRB = bounds.xy + bounds.zw;
        vec4 clipBounds = projectionMatrix * vec4(rectRB, 0.0, 1.0);
        v_clipBoundsR = clipBounds.x;
        v_drawX = gl_Position.x;

        // Calculate atlas UV
        float col = mod(a_noteNumber, atlasCols);
        float row = floor(a_noteNumber / atlasCols);
        vec2 glyphUVOffset = vec2(col, row) / vec2(atlasCols, atlasRows);
        vec2 glyphUVSize = 1.0 / vec2(atlasCols, atlasRows);
        v_uv = glyphUVOffset + position.xy * glyphUVSize;

        v_state = state;
      }
    `,
    `#version 300 es
      precision highp float;

      in vec2 v_uv;
      in vec2 v_state;
      in float v_drawX;
      in float v_clipBoundsR;

      uniform sampler2D u_font;
      uniform vec4 color;
      uniform vec4 selectedColor;

      out vec4 outColor;

      void main() {
        // Clip if out of bounds
        if (v_drawX > v_clipBoundsR) {
            discard;
        }
    
        // Sample font atlas
        vec4 tex = texture(u_font, v_uv);
        float alpha = tex.a;
        alpha = smoothstep(0.3, 0.7, alpha);
        vec4 outCol = mix(color, selectedColor, v_state.y);
        outColor = vec4(outCol.rgb, alpha * outCol.a);
      }
    `,
    {
      a_noteNumber: { size: 1, type: gl.FLOAT, divisor: 1 },
      position: { size: 2, type: gl.FLOAT },
      bounds: { size: 4, type: gl.FLOAT, divisor: 1 },
      state: { size: 2, type: gl.FLOAT, divisor: 1 },
    },
    {
      u_font: uniformSampler2D(),
      projectionMatrix: uniformMat4(),
      color: uniformVec4(),
      selectedColor: uniformVec4(),
    },
    (vertexArray) => new NoteLabelBuffer(vertexArray)
  )

function uniformSampler2D(texture: WebGLTexture | null = null) {
  return {
    initialValue: texture,
    isEqual: (a: WebGLTexture | null, b: WebGLTexture | null) => a === b,
    upload: (
      gl: WebGL2RenderingContext,
      location: WebGLUniformLocation,
      value: WebGLTexture | null
    ) => {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, value)
      gl.uniform1i(location, 0)
    },
  }
}
