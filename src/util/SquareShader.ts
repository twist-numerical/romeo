import * as twgl from "twgl.js";
import { deleteBuffer } from "./twglDelete";

const header = `#version 300 es
precision highp float;
`;

const vertexShader =
  header +
  `
in vec2 pixel;
out vec2 vPixel;

void main() {
  gl_Position = vec4(pixel * 2.0 - 1.0, 0.0, 1.0);
  vPixel = pixel;
}`;

function getProgram(gl: WebGL2RenderingContext, fragmentShader: string) {
  return twgl.createProgramInfo(gl, [
    vertexShader,
    header + "in vec2 vPixel;" + fragmentShader,
  ]);
}

export default class SquareShader {
  private buffers: twgl.BufferInfo;
  programInfo: twgl.ProgramInfo;

  constructor(private gl: WebGL2RenderingContext, fragmentShader: string) {
    this.buffers = twgl.createBufferInfoFromArrays(gl, {
      pixel: { data: [0, 0, 1, 0, 0, 1, 1, 1], numComponents: 2 },
    });
    this.programInfo = getProgram(gl, fragmentShader);
  }

  setProgram(fragmentShader: string) {
    this.gl.deleteProgram(this.programInfo.program);
    this.programInfo = getProgram(this.gl, fragmentShader);
  }

  useProgram() {
    this.gl.useProgram(this.programInfo.program);
  }

  draw() {
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.buffers);
    twgl.drawBufferInfo(this.gl, this.buffers, this.gl.TRIANGLE_STRIP);
  }

  dispose() {
    this.gl.deleteProgram(this.programInfo.program);
    deleteBuffer(this.gl, this.buffers);
  }
}
