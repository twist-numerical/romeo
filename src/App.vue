<template lang="pug">
#container
  Hamburger
    label.form-check(v-for="scheme of colorSchemes")
      input.form-check-input(
        type="radio",
        v-model="activeScheme",
        :value="scheme"
      )
      span.form-check-label {{ scheme }}

  Julia#julia(:colorScheme="activeScheme", :c="marker")
  #mandelbrot-container
    .position-relative.h-100
      Mandelbrot#mandelbrot(
        ref="mandelbrot",
        colorScheme="Gray",
        @click="placeMarker"
      )
      #bullseye.align-middle(:style="bullseye")
        i.bi.bi-bullseye
    .mandelbrot-info
      ComplexNumber(:value="marker")
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Julia from "./components/Julia.vue";
import Mandelbrot from "./components/Mandelbrot.vue";
import ComplexNumber from "./components/ComplexNumber.vue";
import Hamburger from "./components/Hamburger.vue";
import { colorSchemes } from "./util/ColorScheme";

export default defineComponent({
  components: {
    Julia,
    Hamburger,
    Mandelbrot,
    ComplexNumber,
  },
  data() {
    return {
      colorSchemes: Object.keys(colorSchemes),
      activeScheme: "UGent",
      marker: [-0.124, -0.713],
      isMounted: false,
    };
  },
  mounted() {
    this.isMounted = true;
  },
  unmounted() {
    this.isMounted = false;
  },
  computed: {
    bullseye() {
      if (!this.isMounted) return { left: 0, right: 0 };
      const plane = (this.$refs.mandelbrot as any).$refs.complexPlane as any;

      const [x, y] = (this as any).marker;
      const [cx, cy] = plane.center as [number, number];
      const f = plane.vmin;
      return {
        left: f * (0.5 + (x - cx) / plane.zoom) + "px",
        top: f * (0.5 + (cy - y) / plane.zoom) + "px",
      };
    },
  },
  methods: {
    placeMarker(event: MouseEvent) {
      const plane = (this.$refs.mandelbrot as any).$refs.complexPlane as any;
      const rect = (event.target as HTMLElement).getBoundingClientRect();

      const [cx, cy] = plane.center as [number, number];

      this.marker = [
        cx + plane.zoom * ((event.clientX - rect.x) / plane.vmin - 0.5),
        cy + plane.zoom * (0.5 - (event.clientY - rect.y) / plane.vmin),
      ];
    },
  },
});
</script>

<style lang="scss">
@import "./style/vars.scss";

html,
body,
#container,
#app,
#julia {
  width: 100%;
  height: 100%;
}

#mandelbrot-container {
  position: absolute;
  top: $pad;
  left: $pad;
  border-radius: $pad;
  overflow: hidden;

  #mandelbrot {
    opacity: 0.9;
    width: 40vmin;
    height: 40vmin;
    clip-path: path("M 0 2rem L 0,75 A 5,5 0,0,1 150,75 L 200 200 z");
  }

  .mandelbrot-info {
    position: absolute;
    background: rgba(255, 255, 255, 0.4);
    border-radius: $pad 0 0 0;
    padding: $pad calc(3 * $pad);
    bottom: 0;
    right: 0;
    text-align: right;
    font-size: 1.2em;
  }

  #bullseye {
    position: absolute;
    pointer-events: none;

    i {
      $size: 1.2rem;
      font-size: $size;

      display: block;
      margin: calc(-0.5 * $size) 0 0 calc(-0.5 * $size);
      color: red;

      &::before {
        display: block;
        height: $size;
        width: $size;
      }
    }
  }
}
</style>