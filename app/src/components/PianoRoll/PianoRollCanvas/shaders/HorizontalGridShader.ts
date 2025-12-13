import {
  type Buffer,
  rectToTriangles,
  Shader,
  uniformFloat,
  uniformMat4,
  uniformVec4,
  type VertexArray,
} from "@ryohey/webgl-react"
import isEqual from "lodash/isEqual"
import type { Rect } from "../../../../entities/geometry/Rect"

export class HorizontalGridBuffer implements Buffer<Rect, "position"> {
  constructor(readonly vertexArray: VertexArray<"position">) {}

  update(rect: Rect) {
    const positions = rectToTriangles(rect)
    this.vertexArray.updateBuffer("position", new Float32Array(positions))
  }

  get vertexCount() {
    return 6
  }
}

export const HorizontalGridShader = (gl: WebGL2RenderingContext) =>
  new Shader(
    gl,
    `#version 300 es
      precision lowp float;

      uniform mat4 projectionMatrix;
      in vec4 position;
      out vec4 vPosition;

      void main() {
        gl_Position = projectionMatrix * position;
        vPosition = position;
      }
    `,
    `#version 300 es
      precision lowp float;

      uniform vec4 color;
      uniform vec4 highlightedColor;
      uniform vec4 laneColors[12];
      uniform float height;
      
      in vec4 vPosition;

      out vec4 outColor;
      
      void main() {
        float screenHeight = height * 128.0;
        float modY = mod(screenHeight - vPosition.y, height * 12.0);
        float lineWidth = 1.0;

        if (modY < height - lineWidth) {
          outColor = laneColors[0];
        } else if (modY < height) {
          outColor = color;
        } else if (modY < height * 2.0 - lineWidth) {
          outColor = laneColors[1];
        } else if (modY < height * 2.0) {
          outColor = color;
        } else if (modY < height * 3.0 - lineWidth) {
          outColor = laneColors[2];
        } else if (modY < height * 3.0) {
          outColor = color;
        } else if (modY < height * 4.0 - lineWidth) {
          outColor = laneColors[3];
        } else if (modY < height * 4.0) {
          outColor = color;
        } else if (modY < height * 5.0 - lineWidth) {
          outColor = laneColors[4];
        } else if (modY < height * 5.0) {
          outColor = color;
        } else if (modY < height * 6.0 - lineWidth) {
          outColor = laneColors[5];
        } else if (modY < height * 6.0) {
          outColor = color;
        } else if (modY < height * 7.0 - lineWidth) {
          outColor = laneColors[6];
        } else if (modY < height * 7.0) {
          outColor = color;
        } else if (modY < height * 8.0 - lineWidth) {
          outColor = laneColors[7];
        } else if (modY < height * 8.0) {
          outColor = color;
        } else if (modY < height * 9.0 - lineWidth) {
          outColor = laneColors[8];
        } else if (modY < height * 9.0) {
          outColor = color;
        } else if (modY < height * 10.0 - lineWidth) {
          outColor = laneColors[9];
        } else if (modY < height * 10.0) {
          outColor = color;
        } else if (modY < height * 11.0 - lineWidth) {
          outColor = laneColors[10];
        } else if (modY < height * 11.0) {
          outColor = color;
        } else if (modY < height * 12.0 - lineWidth) {
          outColor = laneColors[11];
        } else if (modY < height * 12.0) {
          outColor = highlightedColor;
        }
      }
    `,
    {
      position: { size: 2, type: gl.FLOAT },
    },
    {
      projectionMatrix: uniformMat4(),
      color: uniformVec4(),
      highlightedColor: uniformVec4(),
      laneColors: {
        initialValue: new Float32Array(4 * 12),
        isEqual,
        upload: (gl, loc, value) => gl.uniform4fv(loc, value, 0, 4 * 12),
      },
      height: uniformFloat(),
    },
    (vertexArray) => new HorizontalGridBuffer(vertexArray)
  )
