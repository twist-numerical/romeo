import * as twgl from "twgl.js";

const vertexShader = `#version 300 es
precision highp float;

in vec2 pixel;
out vec2 vPixel;

void main() {
  gl_Position = vec4(pixel * 2.0 - 1.0, 0.0, 1.0);
  vPixel = pixel;
}`;

export default class SquareShader {
  private buffers: twgl.BufferInfo;
  readonly programInfo: twgl.ProgramInfo;

  constructor(private gl: WebGL2RenderingContext, fragmentShader: string) {
    this.buffers = twgl.createBufferInfoFromArrays(gl, {
      pixel: { data: [0, 0, 1, 0, 0, 1, 1, 1], numComponents: 2 },
    });
    this.programInfo = twgl.createProgramInfo(gl, [
      vertexShader,
      "#version 300 es\nprecision highp float;" + fragmentShader,
    ]);
  }

  useProgram() {
    this.gl.useProgram(this.programInfo.program);
  }

  draw() {
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.buffers);
    twgl.drawBufferInfo(this.gl, this.buffers, this.gl.TRIANGLE_STRIP);
  }
}
