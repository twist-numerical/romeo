<template lang="pug">
ComplexPlane(
  ref="complexPlane",
  :update="[c, colorScheme, shouldUpdate]",
  @resize="onResize",
  @context="initGL",
  @render="onRender",
  @viewChanged="viewChanged = true"
)
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent, PropType } from "vue";
import ComplexPlane, { complexPlaneShaderHeader } from "./ComplexPlane.vue";
import ColorScheme from "../util/ColorScheme";
import JuliaShader from "../shaders/Julia";

const MAX_STEPS = 30000;

type CPlane = InstanceType<typeof ComplexPlane>;

export default defineComponent({
  components: { ComplexPlane },
  props: {
    colorScheme: {
      type: String,
      default: "rainbow",
    },
    c: {
      type: Array as unknown as PropType<[number, number]>,
      default: [-0.8, 0.156],
    },
  },
  data() {
    return {
      shader: null as JuliaShader | null,
      viewChanged: true,
      shouldUpdate: 0,
    };
  },
  watch: {
    c() {
      if (this.shader) this.shader.c = this.c;
      this.viewChanged = true;
    },
  },
  unmounted() {
    if (this.shader) this.shader.dispose();
  },
  methods: {
    initGL(gl: WebGL2RenderingContext) {
      if (this.shader) this.shader.dispose();

      this.shader = new JuliaShader(
        gl,
        (this.$refs.complexPlane as CPlane).complexPlane
      );
      this.shader.c = this.c;
    },

    advance(calculateFull: boolean) {
      if (!this.shader) return;

      if (calculateFull) {
        while (this.shader.stepsExecuted < MAX_STEPS) this.shader.advance();
      } else {
        const gl = this.shader.gl;
        gl.flush();
        gl.finish();

        const start = performance.now();
        let i = 0;

        while (
          this.shader.stepsExecuted < MAX_STEPS &&
          performance.now() - start < 5 &&
          i < 5
        ) {
          ++i;
          this.shader.advance();
          gl.flush();
          gl.finish();
        }
        if (this.shader.stepsExecuted < MAX_STEPS) this.shouldUpdate++;
      }
    },
    onRender(fb: twgl.FramebufferInfo | null) {
      if (!this.shader) return;

      if (this.viewChanged) {
        this.shader.changeView();
        this.viewChanged = false;
      }

      this.advance(fb != null);

      this.shader.render(fb, ColorScheme.schemes[this.colorScheme]);
    },
    onResize(width: number, height: number) {
      if (!this.shader) return;

      this.shader.resize(width, height);
    },
    resetView() {
      (this.$refs.complexPlane as any).resetView();
    },
    async generateImage(size: number): Promise<ImageData> {
      return await (
        (this.$refs.complexPlane as CPlane).$refs.webglCanvas as any
      ).generateImage(size);
    },
  },
});
</script>
