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
  methods: {
    onBeforeRender(gl: WebGL2RenderingContext, program: twgl.ProgramInfo) {
      ColorScheme.schemes[this.colorScheme].setUniforms(program);

      // console.log("Before render");
    },
    onAfterRender(gl: WebGL2RenderingContext) {
      // console.log("Render done");
    },
  },
});
</script>
