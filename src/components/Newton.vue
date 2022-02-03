<template lang="pug">
ComplexPlane(
  ref="complexPlane",
  :update="[axes]",
  @render="onRender",
  @context="onContext"
)
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent } from "vue";
import ComplexPlane from "./ComplexPlane.vue";
import ColorScheme from "../util/ColorScheme";
import NewtonShader from "../shaders/Newton";

type CPlane = InstanceType<typeof ComplexPlane>;

export default defineComponent({
  components: { ComplexPlane },
  props: {
    colorScheme: {
      type: String,
      default: "rainbow",
    },
    axes: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      shader: null as NewtonShader | null,
    };
  },
  watch: {
    axes() {
      if (this.shader) this.shader.drawAxes = this.axes;
    },
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
      this.shader = new NewtonShader(
        gl,
        (this.$refs.complexPlane as CPlane).complexPlane as any
      );
      this.shader.drawAxes = this.axes;
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
