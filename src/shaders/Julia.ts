import * as twgl from "twgl.js";
import ColorScheme from "../util/ColorScheme";
import ComplexPlane from "./ComplexPlane";
import SquareShader from "@/util/SquareShader";
import { deleteFramebuffer } from "@/util/twglDelete";

const STEPS_PER_STAGE = 200;

const srcShaderInit =
  ComplexPlane.header +
  `
layout(location=0) out vec2 oZ;
layout(location=1) out highp int oSteps;

void main() {
  oZ = point();
  oSteps = -1;
}`;

const srcShaderAdvance = `
#define MAXSTEPS ${STEPS_PER_STAGE}

uniform sampler2D uZ;
uniform highp isampler2D uSteps;
uniform vec2 c;

layout(location=0) out vec2 oZ;
layout(location=1) out int oSteps;

vec2 cMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

float cMod(vec2 a) {
  return length(a);
}

void main() {
  vec2 z = texture(uZ, vPixel).rg;
  int steps = texture(uSteps, vPixel).r;
  
  if(steps < 0) {
    for(int i = 0; i < MAXSTEPS; ++i) {
      if(cMod(z) > 2.0) {
        steps = -steps - 1;
        break;
      }
      --steps;
      z = cMul(z, z) + c;
    }
  }

  oZ = z;
  oSteps = steps;
}`;

const srcShaderRender =
  ColorScheme.glslCode +
  `
uniform sampler2D uZ;
uniform highp isampler2D uSteps;

out vec4 oColor;

vec3 color(int steps) {
  return colorScheme(float(steps)/60.0);
}

void main() {
  int steps = texture(uSteps, vPixel).r;
  oColor = vec4(color(steps < 0 ? -1 : steps), 1.0);
}`;

export default class Julia {
  framebuffers: [twgl.FramebufferInfo, twgl.FramebufferInfo];
  attachments: twgl.AttachmentOptions[];
  shaders: { init: SquareShader; advance: SquareShader; render: SquareShader };
  stepsExecuted = 0;
  c: [number, number] = [0, 0];

  constructor(
    readonly gl: WebGL2RenderingContext,
    readonly plane: ComplexPlane
  ) {
    this.attachments = [
      {
        internalFormat: gl.RG32F,
        minMag: gl.NEAREST,
      },
      {
        internalFormat: gl.R32I,
        minMag: gl.NEAREST,
      },
    ];

    this.framebuffers = [
      twgl.createFramebufferInfo(gl, this.attachments),
      twgl.createFramebufferInfo(gl, this.attachments),
    ];

    this.shaders = {
      init: new SquareShader(gl, srcShaderInit),
      advance: new SquareShader(gl, srcShaderAdvance),
      render: new SquareShader(gl, srcShaderRender),
    };
  }

  resize(width: number, height: number) {
    this.framebuffers.forEach((f) =>
      twgl.resizeFramebufferInfo(this.gl, f, this.attachments, width, height)
    );
  }

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
  }

  dispose() {
    this.framebuffers.forEach((fb) => deleteFramebuffer(this.gl, fb));
    Object.values(this.shaders).forEach((s) => s.dispose());
  }
}
