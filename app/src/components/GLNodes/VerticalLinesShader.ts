import {
  InstancedBuffer,
  rectToTriangles,
  Shader,
  uniformFloat,
  uniformMat4,
  uniformVec4,
  VertexArray,
} from "@ryohey/webgl-react"

class VerticalLinesBuffer
  implements InstancedBuffer<number[], "position" | "x">
{
  private _instanceCount: number = 0

  constructor(readonly vertexArray: VertexArray<"position" | "x">) {
    this.vertexArray.updateBuffer(
      "position",
      new Float32Array(rectToTriangles({ x: 0, y: 0, width: 1, height: 1 })),
    )
  }

  update(xArray: number[]) {
    this.vertexArray.updateBuffer("x", new Float32Array(xArray))
    this._instanceCount = xArray.length
  }

  get vertexCount() {
    return 6
  }

  get instanceCount() {
    return this._instanceCount
  }
}

export const VerticalLinesShader = (gl: WebGL2RenderingContext) =>
  new Shader(
    gl,
    `#version 300 es
    precision lowp float;
    layout (location = 0) in vec4 position;
    layout (location = 1) in float x;
    uniform mat4 projectionMatrix;
    uniform float height;
    uniform float lineWidth;

    void main() {
      vec4 screenPosition = vec4(position.xy * vec2(lineWidth, height) + vec2(x, 0.0), position.zw);
      gl_Position = projectionMatrix * screenPosition;
    }
    `,
    `#version 300 es
    precision lowp float;
    uniform vec4 color;
    out vec4 outColor;

    void main() {
      outColor = color;
    }
    `,
    {
      position: { size: 2, type: gl.FLOAT },
      x: { size: 1, type: gl.FLOAT, divisor: 1 },
    },
    {
      projectionMatrix: uniformMat4(),
      color: uniformVec4(),
      height: uniformFloat(),
      lineWidth: uniformFloat(),
    },
    (gl) => new VerticalLinesBuffer(gl),
  )
