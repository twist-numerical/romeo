<template lang="pug">
ComplexPlane(
  ref="complexPlane",
  :update="[shouldUpdate]",
  @render="onRender",
  @context="onContext",
  :zoom="4",
  :contextAttributes="{ antialias: true }"
)
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent } from "vue";
import ComplexPlane from "./ComplexPlane.vue";
import LittlewoodShader from "@/shaders/Littlewood";
import ColorScheme from "@/util/ColorScheme";

type CPlane = InstanceType<typeof ComplexPlane>;

export default defineComponent({
  components: { ComplexPlane },
  props: {
    colorScheme: {
      type: String,
      default: ColorScheme.randomScheme().name,
    },
  },
  data() {
    return {
      shader: null as LittlewoodShader | null,
      shouldUpdate: 0,
    };
  },
  watch: {},
  methods: {
    onContext(gl: WebGL2RenderingContext) {
      this.shader = new LittlewoodShader(
        gl,
        (this.$refs.complexPlane as CPlane).complexPlane
      );
    },
    onRender(fb: twgl.FramebufferInfo | null) {
      if (this.shader) {
        this.shader.advance();
        this.shader.render(fb,ColorScheme.schemes[this.colorScheme]);
      }
      ++this.shouldUpdate;
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
