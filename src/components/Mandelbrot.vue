<template lang="pug">
ComplexPlane(ref="complexPlane", @render="onRender", @context="onContext")
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent } from "vue";
import ComplexPlane from "./ComplexPlane.vue";
import ColorScheme from "../util/ColorScheme";
import MandelbrotShader from "../shaders/Mandelbrot";

type CPlane = InstanceType<typeof ComplexPlane>;

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
      shader: null as MandelbrotShader | null,
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
    onContext(gl: WebGL2RenderingContext) {
      this.shader = new MandelbrotShader(
        gl,
        (this.$refs.complexPlane as CPlane).complexPlane as any
      );
    },
    onRender(fb: twgl.FramebufferInfo | null) {
      if (this.shader)
        this.shader.render(fb, ColorScheme.schemes[this.colorScheme]);
    },
    resetView() {
      (this.$refs.complexPlane as any).resetView();
    },
  },
});
</script>
