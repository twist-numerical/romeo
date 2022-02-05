import * as twgl from "twgl.js";
import ColorScheme from "../util/ColorScheme";
import ComplexPlane from "./ComplexPlane";
import SquareShader from "@/util/SquareShader";
import Axes from "./Axes";

const MAX_STEPS = 100;

const srcShader = `
#define newton_MAXSTEPS ${MAX_STEPS}
#define newton_log10 ${Math.log(10)}
#define newton_pi 3.14159265358

out vec4 oColor;

uniform bool uShadeSmooth;
uniform bool uShowRoots;

vec2 newton_cdiv(vec2 a, vec2 b) {
  float n = dot(b, b);
  return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / n;
}

float newton_cube(float x) {
  return x * x * x;
}

bool newton_iswrong(vec2 v) {
  return any(isnan(v)) || any(isinf(v));
}

float newton_easeinout(float x) {
  return x < 0.5 ? 4.0 * x * x * x : 1.0 - 0.5 * newton_cube(2.0 - 2.0*x);
}

void main() {
  vec2 p = point();
  vec2 c = p;
  vec2 fc;
  vec2 dc;
  
  float steps = -1.0;
  for(int i = 0; i < newton_MAXSTEPS; ++i) {
    fc = f(c);
    dc = newton_cdiv(fc, df(c));
    if(newton_iswrong(dc)) break;
    if(length(fc) < 1e-2 && length(dc) < 1e-6) {
      steps = float(i);
      break;
    }
    c -= dc;
  }

  if(steps < 0.0)  {
    oColor = vec4(uColorSchemeNegative, 1.0);
  } else {
    float l = length(c);
    float angle = (1. + atan(c.y, c.x)/newton_pi) * 0.5 * 659.0;
    vec3 col = colorScheme(l*43.223 + (l < 1e-3 ? 0.0 : angle));
    if(uShadeSmooth) {
      float ldc = length(dc);
      float v = 1. + (log(ldc)/newton_log10 + 6.)/6.;
      steps += clamp(v, 0., 1.);
    }
    col = mix(uColorSchemeNegative, col, exp(-pow(0.04*float(steps), 2.0)));

    if(uShowRoots) {
      float d = distance(c, p) / 0.06;
      if(d < 1.0) {
        col = mix(uColorSchemeAxes, col, newton_easeinout(d));
      }
    }

    oColor = vec4(col, 1.0);
  }
}`;

export default class Newton {
  shader: SquareShader;
  drawAxes: boolean = true;
  axes: Axes;
  shadeSmooth: boolean = false;
  showRoots: boolean = false;

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
      uShowRoots: this.showRoots,
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
