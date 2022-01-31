<template lang="pug">
WebGLCanvas(
  ref="webglCanvas",
  @resize="onResize",
  @mousedown="onMousedown",
  @mousemove="onMousemove",
  @mouseup="onMoveend",
  @wheel="onWheel",
  @click="onClick",
  @touchstart="onTouchstart",
  @touchmove="onTouchmove",
  @touchend="onMoveend"
)
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent } from "vue";
import WebGLCanvas from "./WebGLCanvas.vue";
import SquareShader from "../util/SquareShader";
import { saveAs } from "file-saver";

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

type vec2 = [number, number];

export const complexPlaneShaderHeader = `
uniform vec2 zoom;
uniform vec2 center;

vec2 point() {
  return center + zoom * (vPixel - 0.5);
}
`;

function averageTouchPosition(touches: TouchList): [number, number] {
  let x = 0;
  let y = 0;
  for (let i = 0; i < touches.length; ++i) {
    const touch = touches[i];
    x += touch.clientX;
    y += touch.clientY;
  }
  return [x / touches.length, y / touches.length];
}

function touchDistance(touches: TouchList) {
  if (touches.length == 2) {
    const [{ clientX: x1, clientY: y1 }, { clientX: x2, clientY: y2 }] =
      touches;
    return Math.hypot(x1 - x2, y1 - y2);
  }
  return 1;
}

export default defineComponent({
  components: { WebGLCanvas },
  props: {
    shader: { type: String },
    shouldRender: { type: Function, default: () => false },
    uniforms: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      size: [100, 100] as vec2,
      zoom: 3,
      center: [0, 0] as vec2,
      touchPosition: null as {
        position: vec2;
        distance: number;
      } | null,
      mountID: 0,
      isMounted: false,
      needsUpdate: true,
      afterMove: false,
      rendering: true,
      activeFramebuffer: null as twgl.FramebufferInfo | null,
    };
  },
  mounted() {
    const mountID = this.mountID;
    this.needsUpdate = true;
    this.isMounted = true;

    const update = () => {
      if (mountID != this.mountID) return;

      if (this.rendering && (this.needsUpdate || this.shouldRender()))
        this.render();

      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },
  unmounted() {
    this.isMounted = false;
    ++this.mountID;
  },
  computed: {
    context(): WebGL2RenderingContext | null {
      if (!this.isMounted) return null;
      return (this.$refs.webglCanvas as any).context as WebGL2RenderingContext;
    },
    squareShader(): SquareShader | null {
      const gl = this.context;
      if (!gl) return null;
      return new SquareShader(gl, complexPlaneShaderHeader + this.shader);
    },
    vmin(): number {
      return Math.min(...this.size);
    },
    allUniforms() {
      return {
        ...this.uniforms,
        ...this.zoomUniforms,
      };
    },
    zoomUniforms(): { zoom: vec2; center: vec2 } {
      const [width, height] = this.size;
      const f = this.zoom / this.vmin;
      return {
        center: this.center,
        zoom: [f * width, f * height],
      };
    },
  },
  methods: {
    render() {
      const gl = this.context;
      const shader = this.squareShader;
      if (!gl || !shader) return;
      this.$emit("beforeRender", this);
      twgl.bindFramebufferInfo(gl, this.activeFramebuffer);
      shader.useProgram();
      twgl.setUniforms(shader.programInfo, this.allUniforms);
      shader.draw();
      this.needsUpdate = false;
      this.$emit("afterRender", this);
    },
    onResize(width: number, height: number) {
      this.size = [width, height];
      this.$emit("resize", width, height);
    },
    onMousedown(event: MouseEvent) {
      this.touchPosition = {
        position: [event.clientX, event.clientY],
        distance: -1,
      };
      this.afterMove = false;
    },
    onMousemove(event: MouseEvent) {
      if ((event.buttons & 1) == 0) this.touchPosition = null;
      const tp = this.touchPosition;
      if (!tp) return;

      event.preventDefault();

      const f = this.zoom / this.vmin;
      this.center = [
        this.center[0] + f * (tp.position[0] - event.clientX),
        this.center[1] + f * (event.clientY - tp.position[1]),
      ];
      tp.position = [event.clientX, event.clientY];
      this.afterMove = true;
    },
    onTouchstart(event: TouchEvent) {
      if (event.touches.length == 1 || event.touches.length == 2) {
        this.touchPosition = {
          position: averageTouchPosition(event.touches),
          distance: touchDistance(event.touches),
        };
      } else {
        this.touchPosition = null;
      }
      this.afterMove = false;
    },
    onTouchmove(event: TouchEvent) {
      if (event.touches.length != 1 && event.touches.length != 2)
        this.touchPosition = null;

      const tp = this.touchPosition;
      if (!tp) return;

      event.preventDefault();

      const [tx, ty] = averageTouchPosition(event.touches);
      const f = this.zoom / this.vmin;

      this.center = [
        this.center[0] + f * (tp.position[0] - tx),
        this.center[1] + f * (ty - tp.position[1]),
      ];
      if (event.touches.length == 2) {
        const d = touchDistance(event.touches);
        this.zoom *= tp.distance / d;
        tp.distance = d;
      }
      tp.position = [tx, ty];
      this.afterMove = true;
    },
    onMoveend(event: MouseEvent | TouchEvent) {
      if (this.afterMove) {
        event.preventDefault();
      }
      this.touchPosition = null;
    },
    onClick(event: MouseEvent) {
      if (this.afterMove) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    onWheel(event: WheelEvent) {
      if (event.deltaY == 0) return;

      event.preventDefault();

      let step = 1.1;
      if (event.deltaY < 0) step = 1 / step;
      this.zoom *= step;
    },
    resetView() {
      this.center = [0, 0];
      this.zoom = 3;
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
        this.activeFramebuffer = fb;
        this.onResize(size, size);

        this.$nextTick(() => {
          this.render();
          twgl.bindFramebufferInfo(gl, fb);
          const pixels = new Uint8ClampedArray(size * size * 4);
          gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          this.activeFramebuffer = null;
          this.onResize(gl.canvas.width, gl.canvas.height);
          this.rendering = true;

          const imageData = new ImageData(pixels, size, size);
          flipImage(imageData);
          resolve(imageData);
        });
      });
    },
  },
  watch: {
    allUniforms() {
      this.needsUpdate = true;
    },
    squareShader() {
      this.needsUpdate = true;
    },
    context() {
      this.needsUpdate = true;
    },
  },
});
</script>
