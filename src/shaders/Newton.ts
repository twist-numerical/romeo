import * as twgl from "twgl.js";
import ColorScheme from "../util/ColorScheme";
import ComplexPlane from "./ComplexPlane";
import SquareShader from "@/util/SquareShader";
import Axes from "./Axes";

const MAX_STEPS = 200;

const srcShader = `
#define newton_MAXSTEPS ${MAX_STEPS}
#define newton_log10 ${Math.log(10)}
#define newton_pi 3.14159265358

out vec4 oColor;

uniform bool uShadeSmooth;

vec2 newton_cdiv(vec2 a, vec2 b) {
  float n = dot(b, b);
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / n;
}

void main() {
  vec2 c = point();
  vec2 fc;
  vec2 dc;
  
  float steps = -1.0;
  for(int i = 0; i < newton_MAXSTEPS; ++i) {
    fc = f(c);
    dc = newton_cdiv(fc, df(c));
    if(length(fc) < 1e-2 && length(dc) < 1e-6) {
      steps = float(i);
      break;
    }
    c -= dc;
  }

  if(steps < 0.0)
    oColor= vec4(colorScheme(-1.), 1.0);
  else {
    float l = length(c);
    float angle = (1. + atan(c.y, c.x)/newton_pi) * 0.5 * 659.0;
    vec3 col = colorScheme(l*432.23 + (l < 1e-3 ? 0.0 : angle));
    if(uShadeSmooth) {
      float ldc = length(dc);
      float v = 1. + (log(ldc)/newton_log10 + 6.)/6.;
      steps += clamp(v, 0., 1.);
    }
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
    this.shader = new SquareShader(gl, "void main() {}");
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

  setF(f: string) {
    this.shader.setProgram(
      ComplexPlane.header + ColorScheme.glslCode + f + srcShader
    );
  }

  dispose() {
    this.shader.dispose();
  }
}
