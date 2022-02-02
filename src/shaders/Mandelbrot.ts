import * as twgl from "twgl.js";
import ColorScheme from "../util/ColorScheme";
import ComplexPlane from "./ComplexPlane";
import SquareShader from "@/util/SquareShader";

const MAX_STEPS = 800;

const srcShader =
  ComplexPlane.header +
  ColorScheme.glslCode +
  `
#define MAXSTEPS ${MAX_STEPS}

out vec4 oColor;

vec2 cMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

float cMod(vec2 a) {
  return length(a);
}

vec3 color(int steps) {
  return colorScheme(float(steps)/60.0);
}

void main() {
  vec2 c = point();
  vec2 z = vec2(0., 0.);

  int steps = -1;
  for(int i = 0; i < MAXSTEPS; ++i) {
    z = cMul(z, z) + c;
    if(cMod(z) > 2.0) {
      steps =i ;
      break;
    }
  }
  
  oColor= vec4(color(steps), 1.0);
}`;

export default class Julia {
  shader: SquareShader;

  constructor(
    readonly gl: WebGL2RenderingContext,
    readonly plane: ComplexPlane
  ) {
    this.shader = new SquareShader(gl, srcShader);
  }

  render(fb: twgl.FramebufferInfo | null, colorScheme: ColorScheme) {
    twgl.bindFramebufferInfo(this.gl, fb);

    const shader = this.shader;
    shader.useProgram();
    twgl.setUniforms(shader.programInfo, colorScheme.uniforms);
    twgl.setUniforms(shader.programInfo, this.plane.uniforms);
    shader.draw();
  }

  dispose() {
    this.shader.dispose();
  }
}
