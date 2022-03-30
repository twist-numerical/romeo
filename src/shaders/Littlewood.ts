import * as twgl from "twgl.js";
import ColorScheme from "../util/ColorScheme";
import ComplexPlane from "./ComplexPlane";
import SquareShader from "@/util/SquareShader";
import { deleteFramebuffer } from "@/util/twglDelete";
import Axes from "./Axes";
import { flatten } from "mathjs";

const MAX_DEGREE = 16;
const TEXTURE_WIDTH = 2048;
const TEXTURE_HEIGHT = ((1 << MAX_DEGREE) * MAX_DEGREE) / TEXTURE_WIDTH;

const polynomialShader = `
const int MAX_DEGREE = ${MAX_DEGREE};
const int WIDTH = ${TEXTURE_WIDTH};
const int HEIGHT = ${TEXTURE_HEIGHT};

int degree(int polynomial) {
  int degree = -1;
  if(polynomial & 0xFFFF0000) { degree += 16; polynomial >>= 16; }
  if(polynomial & 0xFF00) { degree += 8; polynomial >>= 8; }
  if(polynomial & 0xF0) { degree += 4; polynomial >>= 4; }
  if(polynomial & 0b1100) { degree += 2; polynomial >>= 2; }
  if(polynomial & 0b10) degree += 1;
  return degree;
}

vec2 getRoot(int polynomial, int root) {
  int pos = polynomial * MAX_DEGREE + root;
  int row = pos / WIDTH;
  int col = pos % WIDTH;
  return texture(inRoots, vec2(float(row)/float(HEIGHT), float(col)/float(WIDTH)).xy;
}

vec2 evaluate(int polynomial, vec2 z) {
  vec2 r = vec2(0.0, 0.0);
  while(polynomial > 1) {
    r = cmul(r, z) + (
      polynomial & 1 ? vec2(1., 0.) : vec2(-1., 0.)
    );
    polynomial >>= 1;
  }
  return r;
}
`;

const srcShaderRoots = `
layout(location=0) out vec2 outRoot;

in sampler2D inRoots;

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / dot(b, b);
}

int polynomialID() {
  ivec2 v = ivec2(gl_FragCoord.xy);
  return;
}

${polynomialShader}

void main() {
  ivec2 v = ivec2(gl_FragCoord.xy);
  int rootPosition = (v.x * WIDTH + v.y);
  int polynomialID = rootPosition / MAX_DEGREE;
  int rootID = rootPosition % MAX_DEGREE;
  int d = degree(polynomial);

  if(rootID > d) discard;

  vec2 z = getRoot(polynomial, rootID);

  vec2 denominator = vec2(1.,0.);
  for(int k = 0; k < d && k < MAX_DEGREE; ++k)
    if(k != rootID) {
      denominator = cmul(denominator, getRoot(polynomial, rootID));
    }

  outRoot = z - cdiv(evaluate(polynomial, z), denominator);
}
`;

const srcShaderDrawRootsVertex = `
in sampler2D inRoots;

${polynomialShader}

out vec4 position;

void main() {
  int steps = texture(uSteps, vPixel).r;
  oColor = vec4(color(steps < 0 ? -1 : steps), 1.0);
}`;

const srcShaderDrawRootsFragment = `
out vec4 oColor;

void main() {
  oColor = vec4(1.0, 0.,0., 1.0);
}`;

class RootsShader {
  programInfo: twgl.ProgramInfo;
  buffers: twgl.BufferInfo;

  constructor(private gl: WebGL2RenderingContext) {
    const header = "#version 300 es\nprecision highp float;\n";

    this.programInfo = twgl.createProgramInfo(gl, [
      header + srcShaderDrawRootsVertex,
      header + srcShaderDrawRootsFragment,
    ]);

    const polynomials: number[] = [];
    for (let i = 0; i < 1 << MAX_DEGREE; ++i) polynomials.push(i);

    const roots: number[] = [];
    for (let k = 0; k < MAX_DEGREE; ++k) roots.push(k);

    this.buffers = twgl.createBufferInfoFromArrays(gl, {
      polynomial: {
        numComponents: 1,
        data: new Int32Array(polynomials),
        divisor: 1,
      },
      roots: { numComponents: 1, data: new Int8Array(roots) },
    });
  }

  drawDegree(degree: number) {
    this.buffers.attribs!.roots.offset = 0;
    this.buffers.attribs!.roots.size = degree;
    this.buffers.attribs!.polynomial.offset = 1 << degree;
    this.buffers.attribs!.polynomial.size = 1 << degree;
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.buffers);
    twgl.drawBufferInfo(
      this.gl,
      this.buffers,
      this.gl.POINTS,
      degree,
      undefined,
      1 << degree
    );
  }

  useProgram() {
    this.gl.useProgram(this.programInfo.program);
  }

  draw() {
    this.gl.drawElements(this.gl.POINTS, 10, this.gl.UNSIGNED_BYTE, 0);
  }

  dispose() {
    this.gl.deleteProgram(this.programInfo.program);
  }
}

export default class Julia {
  rootsBuffers: [twgl.FramebufferInfo, twgl.FramebufferInfo];
  shaders: { findRoots: SquareShader; drawRoots: RootsShader };

  constructor(
    readonly gl: WebGL2RenderingContext,
    readonly plane: ComplexPlane
  ) {
    const attachments = [
      {
        internalFormat: gl.RG32F,
        minMag: gl.NEAREST,
      },
    ];
    this.rootsBuffers = [
      twgl.createFramebufferInfo(
        gl,
        attachments,
        TEXTURE_WIDTH,
        TEXTURE_HEIGHT
      ),
      twgl.createFramebufferInfo(
        gl,
        attachments,
        TEXTURE_WIDTH,
        TEXTURE_HEIGHT
      ),
    ];

    this.shaders = {
      findRoots: new SquareShader(gl, srcShaderRoots),
      drawRoots: new RootsShader(gl),
    };

    this.axes = new Axes(gl, plane);
  }

  resize(width: number, height: number) {}

  changeView() {
    const shader = this.shaders.init;
    shader.useProgram();
    twgl.setUniforms(shader.programInfo, this.plane.uniforms);
    twgl.bindFramebufferInfo(this.gl, this.framebuffers[0]);
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0, this.gl.COLOR_ATTACHMENT1]);
    shader.draw();
    this.stepsExecuted = 0;
  }

  advance() {
    const shader = this.shaders.advance;

    [0, 1].forEach((i) => {
      this.stepsExecuted += STEPS_PER_STAGE;
      shader.useProgram();
      twgl.setUniforms(shader.programInfo, {
        c: this.c,
        uZ: this.framebuffers[i].attachments[0],
        uSteps: this.framebuffers[i].attachments[1],
      });
      twgl.bindFramebufferInfo(this.gl, this.framebuffers[1 - i]);
      this.gl.drawBuffers([
        this.gl.COLOR_ATTACHMENT0,
        this.gl.COLOR_ATTACHMENT1,
      ]);
      shader.draw();
    });
  }

  render(fb: twgl.FramebufferInfo | null, colorScheme: ColorScheme) {
    twgl.bindFramebufferInfo(this.gl, fb);
    const shader = this.shaders.render;
    shader.useProgram();
    twgl.setUniforms(shader.programInfo, colorScheme.uniforms);
    twgl.setUniforms(shader.programInfo, {
      uZ: this.framebuffers[0].attachments[0],
      uSteps: this.framebuffers[0].attachments[1],
    });
    shader.draw();

    if (this.drawAxes) this.axes.render(fb, colorScheme);
  }

  dispose() {
    this.framebuffers.forEach((fb) => deleteFramebuffer(this.gl, fb));
    Object.values(this.shaders).forEach((s) => s.dispose());
  }
}
