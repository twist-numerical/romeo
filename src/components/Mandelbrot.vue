<template lang="pug">
ComplexPlane(
  :shader="shader",
  ref="complexPlane",
  :uniforms="uniforms",
  @beforeRender="onBeforeRender",
  @afterRender="onAfterRender"
)
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent } from "vue";
import ComplexPlane from "./ComplexPlane.vue";
import ColorScheme from "../util/ColorScheme";

const srcShader =
  ColorScheme.glslCode +
  `
#define MAXSTEPS 500

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

export default defineComponent({
  components: { ComplexPlane },
  props: {
    colorScheme: {
      type: String,
      default: "rainbow",
    },
  },
  data() {
    return {
      shader: srcShader,
    };
  },
  computed: {
    uniforms() {
      return {
        ...ColorScheme.schemes[this.colorScheme].uniforms,
      };
    },
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
