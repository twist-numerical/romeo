<template lang="pug">
ComplexPlane(
  ref="complexPlane",
  :update="[axes, shadeSmooth, f, showRoots]",
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
    shadeSmooth: {
      type: Boolean,
      default: true,
    },
    showRoots: {
      type: Boolean,
      default: true,
    },
    f: {
      type: String,
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
    shadeSmooth() {
      if (this.shader) this.shader.shadeSmooth = this.shadeSmooth;
    },
    showRoots() {
      if (this.shader) this.shader.showRoots = this.showRoots;
    },
    f: "updateF",
  },
  methods: {
    onContext(gl: WebGL2RenderingContext) {
      this.shader = new NewtonShader(
        gl,
        (this.$refs.complexPlane as CPlane).complexPlane as any
      );
      this.shader.drawAxes = this.axes;
      this.shader.shadeSmooth = this.shadeSmooth;
      this.shader.showRoots = this.showRoots;
      this.updateF();
    },
    onRender(fb: twgl.FramebufferInfo | null) {
      if (this.shader)
        this.shader.render(fb, ColorScheme.schemes[this.colorScheme]);
    },
    resetView() {
      (this.$refs.complexPlane as any).resetView();
    },
    updateF() {
      if (this.shader) {
        const f = this.f
          ? this.f
          : "vec2 f(vec2 z) { return z; } vec2 df(vec2 z) { return vec2(1.,0.); }";
        this.shader.setF(f);
      }
    },
  },
});
</script>
