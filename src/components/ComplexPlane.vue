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
  @touchend="onMoveend",
  :update="[update, complexPlane]"
)
</template>

<script lang="ts">
import * as twgl from "twgl.js";
import { defineComponent } from "vue";
import WebGLCanvas from "./WebGLCanvas.vue";
import ComplexPlane from "../shaders/ComplexPlane";

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
    update: { default: () => [] },
  },
  data() {
    return {
      complexPlane: new ComplexPlane(),
      touchPosition: null as {
        position: vec2;
        distance: number;
      } | null,
      afterMove: false,
      rendering: true,
      activeFramebuffer: null as twgl.FramebufferInfo | null,
    };
  },
  watch: {
    complexPlane: {
      deep: true,
      handler() {
        this.$emit("viewChanged");
      },
    },
  },
  methods: {
    onResize(width: number, height: number) {
      this.complexPlane.size = [width, height];
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

      const f = this.complexPlane.scaleFactor;
      this.complexPlane.center = [
        this.complexPlane.center[0] + f * (tp.position[0] - event.clientX),
        this.complexPlane.center[1] + f * (event.clientY - tp.position[1]),
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
      const f = this.complexPlane.scaleFactor;

      this.complexPlane.center = [
        this.complexPlane.center[0] + f * (tp.position[0] - tx),
        this.complexPlane.center[1] + f * (ty - tp.position[1]),
      ];
      if (event.touches.length == 2) {
        const d = touchDistance(event.touches);
        this.complexPlane.zoom *= tp.distance / d;
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
      this.complexPlane.zoom *= step;
    },
    resetView() {
      this.complexPlane.center = [0, 0];
      this.complexPlane.zoom = 3;
    },
  },
});
</script>
