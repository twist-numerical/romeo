import * as twgl from "twgl.js";
import ColorScheme from "../util/ColorScheme";
import ComplexPlane from "./ComplexPlane";
import SquareShader from "@/util/SquareShader";
import Axes from "./Axes";

const srcShader =
  ComplexPlane.header +
  ColorScheme.glslCode +
  `
vec3 base = vec3(0.573, 0.192, 0.345);
vec3 speed = vec3(0.427, 0.608, 0.204);

out vec4 color;

struct Item {
  vec2 value;
  float reach;
  vec2 xn;
};

vec2 cmul(vec2 a, vec2 b) {
  return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cinv(vec2 a) {
  return vec2(a.x, -a.y)/(a.x*a.x + a.y*a.y);
}

void main() {
  Item stack[21];
  int head = 0;
  vec2 z = point();
  float r = length(z);
  if(r > 1.) {
    z = cinv(z);
    r = 1./r;
  }
  if(r > 0.84089) {
    color = vec4(uColorSchemeAxes, 1.0);
    return;
  } 
  stack[0].value = vec2(1., 0.);
  stack[0].reach = r/(1.-r);
  stack[0].xn = vec2(1., 0.);
  
  for(int i = 0; i < 100; ++i) {
    vec2 xn = cmul(stack[head].xn, z);
    float reach = stack[head].reach - length(xn);
    
    vec2 vp = stack[head].value + xn;
    float rp = length(vp);
    vec2 vm = stack[head].value - xn;
    float rm = length(vm);


    if(rp < 1e-8 || rm < 1e-8) {
      break;
    }
    --head;

    if(rp < reach) {
      ++head;
      stack[head].reach = reach;
      stack[head].value = vp;
      stack[head].xn = xn;
    }
    if(rm < reach) {
      ++head;
      stack[head].reach = reach;
      stack[head].value = vm;
      stack[head].xn = xn;
    }

    if(head >= 20 || head < 0)
      break;
  }
  if(head < 0) {
    color = vec4(uColorSchemeNegative, 1.0);
  } else {
    color = vec4(uColorSchemeAxes, 1.0);
  }
}`;

export default class LittlewoodProvenShader extends SquareShader {
  constructor(gl: WebGL2RenderingContext) {
    super(gl, srcShader);
  }
}
