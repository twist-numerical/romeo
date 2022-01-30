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

type vec2 = [number, number];

const shaderHeader = `
in vec2 vPixel;

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
      needsUpdate: true,
      afterMove: false,
    };
  },
  mounted() {
    const mountID = this.mountID;
    this.needsUpdate = true;

    const update = () => {
      if (mountID != this.mountID) return;

      this.render();

      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },
  unmounted() {
    ++this.mountID;
  },
  computed: {
    context(): WebGL2RenderingContext {
      const context = (this.$refs.webglCanvas as any).context;
      if (!context)
        throw new Error("Context requested but no context present.");
      return context as WebGL2RenderingContext;
    },
    squareShader(): SquareShader {
      return new SquareShader(this.context, shaderHeader + this.shader);
    },
    vmin(): number {
      return Math.min(...this.size);
    },
    uniforms(): { zoom: vec2; center: vec2 } {
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
      if (!gl) return;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      this.squareShader.useProgram();
      this.$emit("beforeRender", gl, this.squareShader.programInfo);
      twgl.setUniforms(this.squareShader.programInfo, this.uniforms);
      this.squareShader.draw();
      this.$emit("afterRender", gl);
    },
    onResize(width: number, height: number) {
      this.size = [width, height];
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
      this.center[0] += f * (tp.position[0] - event.clientX);
      this.center[1] += f * (event.clientY - tp.position[1]);
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

      this.center[0] += f * (tp.position[0] - tx);
      this.center[1] += f * (ty - tp.position[1]);
      if (event.touches.length == 2) {
        const d = touchDistance(event.touches);
        this.zoom *= tp.distance / d;
        tp.distance = d;
      }
      tp.position = [tx, ty];
      this.afterMove = true;
    },
    onMoveend(event: MouseEvent | TouchEvent) {
      if (this.touchPosition) {
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
  },
  watch: {
    uniforms() {
      this.needsUpdate = true;
    },
  },
});
</script>
