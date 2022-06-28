import * as twgl from "twgl.js";
import ComplexPlane from "./ComplexPlane";
import SquareShader from "@/util/SquareShader";
import { deleteBuffer, deleteFramebuffer } from "@/util/twglDelete";
import ColorScheme from "@/util/ColorScheme";
import LittlewoodProvenShader from "./LittlewoodProven";

const MAX_DEGREE = 16;
const TEXTURE_WIDTH = 2048;
const TEXTURE_HEIGHT = ((1 << (MAX_DEGREE + 1)) * MAX_DEGREE) / TEXTURE_WIDTH;

const polynomialShader = `
uniform sampler2D uRoots;

const int MAX_DEGREE = ${MAX_DEGREE};
const int WIDTH = ${TEXTURE_WIDTH};
const int HEIGHT = ${TEXTURE_HEIGHT};

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / dot(b, b);
}

int degree(int polynomial) {
  int degree = -1;
  if((polynomial & 0xFFFF0000) != 0) { degree += 16; polynomial >>= 16; }
  if((polynomial & 0xFF00) != 0) { degree += 8; polynomial >>= 8; }
  if((polynomial & 0xF0) != 0) { degree += 4; polynomial >>= 4; }
  if((polynomial & 12) != 0) { degree += 2; polynomial >>= 2; }
  if((polynomial & 2) != 0) degree += 1;
  return degree;
}

vec2 getRoot(int polynomial, int root) {
  int pos = polynomial * MAX_DEGREE + root;
  float row = 0.5 + float(pos / WIDTH);
  float col = 0.5 + float(pos % WIDTH);
  return texture(
    uRoots,
    vec2(col/float(WIDTH), row/float(HEIGHT))
  ).xy;
}

vec2 evaluate(int polynomial, vec2 z) {
  vec2 r = vec2(0.0, 0.0);
  while(polynomial > 1) {
    r = cmul(r, z) + (
      (polynomial & 1) == 0 ? vec2(1., 0.) : vec2(-1., 0.)
    );
    polynomial >>= 1;
  }
  return r;
}
`;

const srcShaderRoots = `
layout(location=0) out vec2 outRoot;

uniform float uSpeed;

${polynomialShader}

void main() {
  ivec2 v = ivec2(vPixel * vec2(WIDTH, HEIGHT));
  int rootPosition = (v.y * WIDTH + v.x);
  int polynomialID = rootPosition / MAX_DEGREE;
  int rootID = rootPosition % MAX_DEGREE;
  int d = degree(polynomialID);

  if(rootID > d) discard;

  vec2 z = getRoot(polynomialID, rootID);

  vec2 denominator = vec2(1.,0.);
  for(int k = 0; k < d && k < MAX_DEGREE; ++k)
    if(k != rootID) {
      denominator = cmul(denominator, z - getRoot(polynomialID, k));
    }

  outRoot = z - uSpeed * cdiv(evaluate(polynomialID, z), denominator);
}
`;

const srcShaderInit = `
uniform float seed;

layout(location=0) out vec2 outRoot;

float rand(vec2 co, float seed) {
  co.x += seed;
  co.y += 0.12345 + seed;
  highp float a = 12.9898;
  highp float b = 78.233;
  highp float c = 43758.5453;
  highp float dt= dot(co.xy ,vec2(a,b));
  highp float sn= mod(dt,3.14);
  return fract(sin(sn) * c);
}

void main() {
  outRoot = 4.0 * vec2(
    rand(vPixel, seed),
    rand(vPixel, seed + 0.6543)
  ) - 2.0;
}
`;

const srcShaderDrawRootsVertex = `
${ComplexPlane.shaderUniforms}

${polynomialShader}

in int polynomial;
in int root;

uniform float uPointSize;

void main() {
  vec2 z = getRoot(polynomial, root);
  gl_Position = vec4(2.0*(z - center)/zoom, 0., 1.);
  gl_PointSize = uPointSize;
}`;

const srcShaderDrawRootsFragment = `
out vec4 oColor;
uniform float uPointSize;
uniform vec3 uColor;

void main() {
  if(length(gl_PointCoord - 0.5) >= 0.5) discard;
  oColor = vec4(uColor, 1.0);
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
    for (let i = 0; i < 2 << MAX_DEGREE; ++i) polynomials.push(i);

    const roots: number[] = [];
    for (let k = 0; k < MAX_DEGREE; ++k) roots.push(k);

    this.buffers = twgl.createBufferInfoFromArrays(gl, {
      polynomial: {
        numComponents: 1,
        data: new Int32Array(polynomials),
        divisor: 0,
      },
      root: { divisor: 1, numComponents: 1, data: new Int8Array(roots) },
    });

    // To reset the divisor call this, or make sure other buffers set {divisor: 0}
    // gl.vertexAttribDivisor(..., 0);
  }

  drawDegree(degree: number) {
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.buffers);
    twgl.drawBufferInfo(
      this.gl,
      this.buffers,
      this.gl.POINTS,
      1 << (degree),
      1 << (degree),
      degree-1
    );
  }

  useProgram() {
    this.gl.useProgram(this.programInfo.program);
  }

  dispose() {
    this.gl.deleteProgram(this.programInfo.program);
    deleteBuffer(this.gl, this.buffers);
  }
}

export default class LittlewoodShader {
  rootsBuffers: [twgl.FramebufferInfo, twgl.FramebufferInfo];
  shaders: {
    initRoots: SquareShader;
    findRoots: SquareShader;
    drawRoots: RootsShader;
    littlewoodProven: LittlewoodProvenShader;
  };
  speed = 1;

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
      initRoots: new SquareShader(gl, srcShaderInit),
      findRoots: new SquareShader(gl, srcShaderRoots),
      drawRoots: new RootsShader(gl),
      littlewoodProven: new LittlewoodProvenShader(gl),
    };

    this.initRoots();
  }

  initRoots() {
    const shader = this.shaders.initRoots;
    shader.useProgram();
    twgl.setUniforms(shader.programInfo, {
      seed: Math.random(),
    });
    twgl.bindFramebufferInfo(this.gl, this.rootsBuffers[0]);
    this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);
    shader.draw();
  }

  advance() {
    const gl = this.gl;
    const shader = this.shaders.findRoots;

    [0, 1].forEach((i) => {
      shader.useProgram();
      twgl.setUniforms(shader.programInfo, {
        uRoots: this.rootsBuffers[i].attachments[0],
        uSpeed: this.speed,
      });
      twgl.bindFramebufferInfo(gl, this.rootsBuffers[1 - i]);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      shader.draw();
    });

    this.speed *= 0.999;
  }

  render(fb: twgl.FramebufferInfo | null, colorScheme: ColorScheme) {
    twgl.bindFramebufferInfo(this.gl, fb);

    const proven = this.shaders.littlewoodProven;
    proven.useProgram();
    twgl.setUniforms(proven.programInfo, {
      ...this.plane.uniforms,
      ...colorScheme.uniforms,
    });
    proven.draw();

    const shader = this.shaders.drawRoots;
    shader.useProgram();
    twgl.setUniforms(shader.programInfo, this.plane.uniforms);
    twgl.setUniforms(shader.programInfo, {
      uRoots: this.rootsBuffers[0].attachments[0],
    });
    for (let i = MAX_DEGREE; i > 2; --i) {
      twgl.setUniforms(shader.programInfo, {
        uPointSize: 4 + (4 * (MAX_DEGREE - i)) / MAX_DEGREE,
        uColor: colorScheme.get(i / MAX_DEGREE),
      });
      shader.drawDegree(i);
    }
  }

  dispose() {
    this.rootsBuffers.forEach((fb) => deleteFramebuffer(this.gl, fb));
    Object.values(this.shaders).forEach((s) => s.dispose());
  }
}
