<template lang="pug">
div
  canvas(ref="canvas", style="width: 100%; height: 100%")
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    scaling: {
      default: 1,
      type: Number,
    },
  },
  data() {
    return { context: null as WebGL2RenderingContext | null };
  },
  mounted(): void {
    this.context = this.createContext(this.$refs.canvas as HTMLCanvasElement);
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
  },
  unmounted(): void {
    window.removeEventListener("resize", (this as any)._resizeListener);
  },
  methods: {
    createContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
      return twgl.getContext(canvas) as WebGL2RenderingContext;
    },
    resize(): void {
      const canvas = this.$refs.canvas as undefined | HTMLCanvasElement;
      if (canvas && twgl.resizeCanvasToDisplaySize(canvas, this.scaling)) {
        this.$emit("resize", canvas.width, canvas.height);
      }
    },
  },
});
</script>
