import { deleteBuffer } from "@/util/twglDelete";
import * as twgl from "twgl.js";
import ComplexPlane from "./ComplexPlane";
import * as v2 from "../util/vec2";

type vec2 = v2.vec2;

const vertexLineShader = `#version 300 es
precision highp float;

${ComplexPlane.shaderUniforms}

in vec2 position;
in vec2 offset;

void main() {
  gl_PointSize = 10.0;
  vec2 p = position + 0.01 * offset;
  gl_Position = vec4((p - center) / zoom*2.0, 0.0, 1.0);
}
`;

const fragmentLineShader = `#version 300 es
precision highp float;

${ComplexPlane.shaderUniforms}

in vec2 position; 

out vec4 color;

void main() {
  color = vec4(1.,0.,1.,1.);
}
`;

export default class Axes {
  lineBuffer: twgl.BufferInfo;
  program: twgl.ProgramInfo;

  constructor(
    readonly gl: WebGL2RenderingContext,
    readonly plane: ComplexPlane
  ) {
    const l = 1.1;
    const a = 0.05;
    const tickSize = 0.025;

    const position: number[] = [];
    const offset: number[] = [];
    const indices: number[] = [];

    const addLine = (points: vec2[]) => {
      const ortho = ([x1, y1]: vec2, [x2, y2]: vec2) =>
        v2.normalized([y1 - y2, x2 - x1]);
      if (points.length < 2) return;

      for (let i = 1; i < points.length; ++i) {
        let j = position.length / 2;
        const a = points[i - 1];
        const b = points[i];

        const o = ortho(a, b);
        position.push(...a, ...a, ...b, ...b);
        offset.push(...o, ...v2.negate(o), ...o, ...v2.negate(o));

        indices.push(j, j + 1, j + 3, j, j + 2, j + 3);
      }
    };

    const lines: vec2[][] = [
      [
        [-l, 0],
        [l, 0],
      ],
      [
        [l - a, a],
        [l, 0],
        [l - a, -a],
      ],
    ];

    for (let i = -10; i <= 10; ++i) {
      const x = i / 10;
      lines.push([
        [x, 0],
        [x, -tickSize],
      ]);
    }

    lines.forEach((line) => {
      addLine(line);
      addLine(line.map(([x, y]) => [y, x]));
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

    console.log(this.lineBuffer);
    this.program = twgl.createProgramInfo(gl, [
      vertexLineShader,
      fragmentLineShader,
    ]);
  }

  render(fb: twgl.FramebufferInfo | null) {
    const gl = this.gl;
    gl.useProgram(this.program.program);
    twgl.bindFramebufferInfo(gl, fb);
    twgl.setUniforms(this.program, this.plane.uniforms);
    twgl.setBuffersAndAttributes(this.gl, this.program, this.lineBuffer);
    twgl.drawBufferInfo(gl, this.lineBuffer);
  }

  dispose() {
    deleteBuffer(this.gl, this.lineBuffer);
  }
}
