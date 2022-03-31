<template lang="pug">
div
  canvas(ref="canvas", style="width: 100%; height: 100%")
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent } from "vue";
import { deleteFramebuffer } from "@/util/twglDelete";

function flipImage(image: ImageData) {
  const data = new Int32Array(image.data.buffer);
  for (let i = 0; 2 * i < image.height; ++i) {
    for (let j = 0; j < image.width; ++j) {
      const k1 = i * image.width + j;
      const k2 = (image.height - i - 1) * image.width + j;
      const t = data[k1];
      data[k1] = data[k2];
      data[k2] = t;
    }
  }
}

export default defineComponent({
  props: {
    scaling: {
      default: 1,
      type: Number,
    },
    update: {
      default: () => [],
    },
    contextAttributes: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      mountID: 0,
      isMounted: false,
      needsUpdate: true,
      rendering: true,
      context: null as WebGL2RenderingContext | null,
    };
  },
  mounted(): void {
    const mountID = this.mountID;
    this.needsUpdate = true;
    this.isMounted = true;
    this.context = twgl.getContext(
      this.$refs.canvas as HTMLCanvasElement,
      this.contextAttributes
    ) as WebGL2RenderingContext;
    this.$emit("context", this.context);
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();

    const update = () => {
      if (mountID != this.mountID) return;

      if (this.rendering && this.needsUpdate) this.render();

      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },
  unmounted(): void {
    window.removeEventListener("resize", (this as any)._resizeListener);
    this.isMounted = false;
    ++this.mountID;
  },
  methods: {
    render(fb: twgl.FramebufferInfo | null = null) {
      this.$emit("render", fb);
      this.needsUpdate = false;
    },
    resize(): void {
      const canvas = this.$refs.canvas as undefined | HTMLCanvasElement;
      if (canvas) {
        twgl.resizeCanvasToDisplaySize(canvas, this.scaling);
        this.$emit("resize", canvas.width, canvas.height);
      }
    },
    async generateImage(size = 4098): Promise<ImageData> {
      return new Promise((resolve, reject) => {
        const gl = this.context;
        if (!gl) return reject("No context present");
        const fb = twgl.createFramebufferInfo(
          gl,
          [{ format: gl.RGBA, type: gl.UNSIGNED_BYTE }],
          size,
          size
        );

        this.rendering = false;
        this.$emit("resize", size, size);

        this.$nextTick(() => {
          this.render(fb);
          twgl.bindFramebufferInfo(gl, fb);
          const pixels = new Uint8ClampedArray(size * size * 4);
          gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          deleteFramebuffer(gl, fb);
          this.resize();
          this.rendering = true;
          this.needsUpdate = true;

          const imageData = new ImageData(pixels, size, size);

          flipImage(imageData);
          resolve(imageData);
        });
      });
    },
  },
  watch: {
    update: {
      deep: true,
      handler() {
        this.needsUpdate = true;
      },
    },
  },
});
</script>
