import * as twgl from "twgl.js";
import ColorScheme from "../util/ColorScheme";
import ComplexPlane from "./ComplexPlane";
import SquareShader from "@/util/SquareShader";
import Axes from "./Axes";

const MAX_STEPS = 800;

const srcShader =
  ComplexPlane.header +
  ColorScheme.glslCode +
  `
#define MAXSTEPS ${MAX_STEPS}

out vec4 oColor;

uniform bool uShadeSmooth;

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cdiv(vec2 a, vec2 b) {
  float n = dot(b, b);
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / n;
}

float cmod(vec2 a) {
  return length(a);
}

vec2 f(vec2 c) {
  vec2 c2 = cmul(c, c);
  vec2 c4 = cmul(c2, c2);
  return cmul(c4, c) - vec2(1., 0.);
}

vec2 df(vec2 c) {
  vec2 c2 = cmul(c, c);
  vec2 c4 = cmul(c2, c2);
  return 5.*c4;
}

void main() {
  vec2 c = point();
  vec2 fc;
  
  float steps = -1.0;
  for(int i = 0; i < 100; ++i) {
    fc = f(c);
    if(cmod(fc) < 1e-6) {
      steps = float(i);
      break;
    }
    c -= cdiv(fc, df(c));
  }

  if(steps < 0.0)
    oColor= vec4(colorScheme(-1.), 1.0);
  else {
    vec3 col = colorScheme(abs(dot(c, vec2(1.1e3, 1.2e3))));
    if(uShadeSmooth)
      steps += clamp(cmod(fc)*1e6, 0., 1.);
    col *= exp(-pow(0.04*float(steps), 2.0));
    oColor= vec4(col, 1.0);
  }
}`;

export default class Newton {
  shader: SquareShader;
  drawAxes: boolean = true;
  axes: Axes;
  shadeSmooth: boolean = false;

  constructor(
    readonly gl: WebGL2RenderingContext,
    readonly plane: ComplexPlane
  ) {
    this.shader = new SquareShader(gl, srcShader);
    this.axes = new Axes(gl, plane);
  }

  render(fb: twgl.FramebufferInfo | null, colorScheme: ColorScheme) {
    twgl.bindFramebufferInfo(this.gl, fb);

    const shader = this.shader;
    shader.useProgram();
    twgl.setUniforms(shader.programInfo, colorScheme.uniforms);
    twgl.setUniforms(shader.programInfo, this.plane.uniforms);
    twgl.setUniforms(shader.programInfo, {
      uShadeSmooth: this.shadeSmooth,
    });
    shader.draw();

    if (this.drawAxes) this.axes.render(fb, colorScheme);
  }

  dispose() {
    this.shader.dispose();
  }
}
