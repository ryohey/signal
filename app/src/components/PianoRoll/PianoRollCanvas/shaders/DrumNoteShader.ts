import { Shader, uniformMat4, uniformVec4 } from "@ryohey/webgl-react"
import { NoteBuffer } from "./NoteShader"

export const DrumNoteShader = (gl: WebGL2RenderingContext) =>
  new Shader(
    gl,
    `#version 300 es
      precision lowp float;

      uniform mat4 projectionMatrix;

      in vec4 position;
      in vec4 bounds;  // [x, y, width, height]
      in vec2 state; // [velocity, isSelected]

      out vec4 vBounds;
      out vec2 vPosition;
      out vec2 vState;

      void main() {
        vec4 transformedPosition = vec4((position.xy * bounds.zw + bounds.xy), position.zw);
        gl_Position = projectionMatrix * transformedPosition;
        vBounds = bounds;
        vPosition = transformedPosition.xy;
        vState = state;
      }
    `,
    `#version 300 es
      precision lowp float;

      uniform vec4 strokeColor;
      uniform vec4 selectedColor;
      uniform vec4 inactiveColor;
      uniform vec4 activeColor;

      in vec4 vBounds;
      in vec2 vPosition;
      in vec2 vState;

      out vec4 outColor;

      void main() {
        float border = 1.0;
        
        float r = vBounds.w / 2.0;
        vec2 center = vBounds.xy + vBounds.zw / 2.0;
        float len = length(vPosition - center);

        if (len < r - border) {
          // if selected, draw selected color
          // otherwise, draw color based on velocity by mixing active and inactive color
          outColor = mix(mix(inactiveColor, activeColor, vState.x), selectedColor, vState.y);
        } else if (len < r) {
          outColor = strokeColor;
        }
      }
    `,
    {
      position: { size: 2, type: gl.FLOAT },
      bounds: { size: 4, type: gl.FLOAT, divisor: 1 },
      state: { size: 2, type: gl.FLOAT, divisor: 1 },
    },
    {
      projectionMatrix: uniformMat4(),
      strokeColor: uniformVec4(),
      inactiveColor: uniformVec4(),
      activeColor: uniformVec4(),
      selectedColor: uniformVec4(),
    },
    (vertexArray) => new NoteBuffer(vertexArray),
  )
