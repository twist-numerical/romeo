import { deleteBuffer } from "@/util/twglDelete";
import * as twgl from "twgl.js";
import ComplexPlane from "./ComplexPlane";

const vertexLineShader = `#version 300 es
precision highp float;

${ComplexPlane.shaderUniforms}

in vec2 position; 

void main() {
  gl_PointSize = 10.0;
  gl_Position = vec4((position - center) / zoom*2.0, 0.0, 1.0);
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
    const lines = [];

    const l = 1.1;
    const a = 0.05;
    const tickSize = 0.025;

    lines.push(-l, 0, l, 0);
    lines.push(l, 0, l - a, a);
    lines.push(l, 0, l - a, -a);

    for (let i = -10; i <= 10; ++i) {
      const x = i / 10;
      lines.push(x, 0, x, -tickSize);
    }

    // Add flipped version
    for (let i = 0, s = lines.length; i < s; i += 2)
      lines.push(lines[i + 1], lines[i]);

    this.lineBuffer = twgl.createBufferInfoFromArrays(gl, {
      position: {
        data: lines,
        numComponents: 2,
      },
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
    gl.lineWidth(5);
    twgl.setUniforms(this.program, this.plane.uniforms);
    twgl.setBuffersAndAttributes(this.gl, this.program, this.lineBuffer);
    twgl.drawBufferInfo(gl, this.lineBuffer, gl.LINES);
  }

  dispose() {
    deleteBuffer(this.gl, this.lineBuffer);
  }
}
