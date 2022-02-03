import { deleteBuffer } from "@/util/twglDelete";
import * as twgl from "twgl.js";
import ComplexPlane from "./ComplexPlane";
import * as v2 from "../util/vec2";
import ColorScheme from "@/util/ColorScheme";

type vec2 = v2.vec2;

const vertexLineShader = `#version 300 es
precision highp float;

${ComplexPlane.shaderUniforms}

in vec2 position;
in vec2 offset;
in vec2 tick;

uniform float uLineWidth;
uniform float uTickSize;

void main() {
  vec2 p = position + uLineWidth * offset;
  gl_Position = vec4((p - center) / zoom*2.0, 0.0, 1.0);
}
`;

const fragmentLineShader = `#version 300 es
precision highp float;

${ComplexPlane.shaderUniforms}

in vec2 position;

uniform vec3 uColor;

out vec4 color;

void main() {
  color = vec4(uColor, 1.0);
}
`;

export default class Axes {
  lineBuffer: twgl.BufferInfo;
  program: twgl.ProgramInfo;
  lineWidth = 4;

  constructor(
    readonly gl: WebGL2RenderingContext,
    readonly plane: ComplexPlane
  ) {
    const tickSize = 4;
    const arrowSize = 6;

    const position: number[] = [];
    const offset: number[] = [];
    const indices: number[] = [];

    const curvePoints = 8;

    const addLine = (points: vec2[], offsets: vec2[]) => {
      const ortho = ([x1, y1]: vec2, [x2, y2]: vec2) => {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return v2.normalized([dy, -dx]);
      };
      if (points.length < 2) return;

      for (let i = 1; i < points.length; ++i) {
        let j = position.length / 2;
        const a = points[i - 1];
        const b = points[i];
        const oa = offsets[i - 1];
        const ob = offsets[i];

        const o = ortho(v2.sum(a, oa), v2.sum(b, ob));

        for (let k = 0; k <= curvePoints; ++k) {
          const angle = (Math.PI * k) / curvePoints;
          position.push(...a);
          offset.push(...v2.sum(v2.rotate(o, -angle), oa));
          position.push(...b);
          offset.push(...v2.sum(v2.rotate(o, angle), ob));
        }

        for (let k = 0; k < curvePoints; ++k) {
          indices.push(j, j + 2 * k, j + 2 * (k + 1));
          indices.push(j + 1, j + 2 * k + 1, j + 2 * (k + 1) + 1);
        }

        const cp = curvePoints;
        indices.push(j, j + 2 * cp, j + 2 * cp + 1, j, j + 2 * cp + 1, j + 1);
      }
    };

    const lines: { line: vec2[]; offset: vec2[] }[] = [
      {
        line: [
          [-1.1, 0],
          [1, 0],
        ],
        offset: [
          [0, 0],
          [2.5 * arrowSize, 0],
        ],
      },
      {
        line: [
          [1, 0],
          [1, 0],
          [1, 0],
        ],
        offset: [
          [1.5 * arrowSize, arrowSize],
          [2.5 * arrowSize, 0],
          [1.5 * arrowSize, -arrowSize],
        ],
      },
    ];

    for (let i = -10; i <= 10; ++i) {
      if (i == 0) continue;
      const x = i / 10;
      lines.push({
        line: [
          [x, 0],
          [x, 0],
        ],
        offset: [
          [0, 0],
          [0, -tickSize * (i % 10 == 0 ? 2 : i % 5 == 0 ? 1.5 : 1)],
        ],
      });
    }

    lines.forEach(({ line, offset }) => {
      addLine(line, offset);
      addLine(
        line.map(([x, y]) => [y, x]),
        offset.map(([x, y]) => [y, x])
      );
    });
    // Add flipped version
    for (let i = 0; i < lines.length; i += 1) {}

    this.lineBuffer = twgl.createBufferInfoFromArrays(gl, {
      position: {
        data: position,
        numComponents: 2,
      },
      offset: {
        data: offset,
        numComponents: 2,
      },
      indices: indices,
    });

    this.program = twgl.createProgramInfo(gl, [
      vertexLineShader,
      fragmentLineShader,
    ]);
  }

  render(fb: twgl.FramebufferInfo | null, colorScheme: ColorScheme) {
    const gl = this.gl;
    gl.useProgram(this.program.program);
    twgl.bindFramebufferInfo(gl, fb);
    twgl.setUniforms(this.program, this.plane.uniforms);
    let lw = (0.5 * this.lineWidth * this.plane.zoom) / this.plane.vmin;
    if (this.plane.zoom > 3) lw /= this.plane.zoom / 3;
    twgl.setUniforms(this.program, {
      uLineWidth: lw,
      uColor: colorScheme.axes,
    });
    twgl.setBuffersAndAttributes(this.gl, this.program, this.lineBuffer);
    twgl.drawBufferInfo(gl, this.lineBuffer);
  }

  dispose() {
    deleteBuffer(this.gl, this.lineBuffer);
  }
}
