<template lang="pug">
ComplexPlane(
  :shader="shader",
  ref="webglCanvas",
  @beforeRender="onBeforeRender",
  @afterRender="onAfterRender"
)
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import * as Vue from "vue";
import ComplexPlane from "./ComplexPlane.vue";

const srcShader = `
#define MAXSTEPS 500

out vec4 oColor;

vec2 cMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

float cMod(vec2 a) {
  return length(a);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 color(int steps) {
  return hsv2rgb(vec3(0.1+0.5*log(1.0+30.0*float(steps)/float(MAXSTEPS)), 1.0, 0.8));
}

void main() {
  vec2 z = point();

  int steps = -1;
  for(int i = 0; i < MAXSTEPS; ++i) {
    z = cMul(z, z) + vec2(-0.8, 0.156);
    if(cMod(z) > 2.0) {
      steps =i ;
      break;
    }
  }
  if(steps == -1) {
    oColor = vec4(0.,0.,0.,1.);
  } else {
    oColor = vec4(color(steps),1.);
  }
}`;

export default Vue.defineComponent({
  components: { ComplexPlane },
  data() {
    return {
      shader: srcShader,
    };
  },
  methods: {
    onBeforeRender(gl: WebGL2RenderingContext, program: twgl.ProgramInfo) {
      // console.log("Before render");
    },
    onAfterRender(gl: WebGL2RenderingContext) {
      // console.log("Render done");
    },
  },
});
</script>
