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
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Julia from "./components/Julia.vue";
import Mandelbrot from "./components/Mandelbrot.vue";
import Hamburger from "./components/Hamburger.vue";
import { colorSchemes } from "./util/ColorScheme";

export default defineComponent({
  components: {
    Julia,
    Hamburger,
    Mandelbrot,
  },
  data() {
    return {
      colorSchemes: Object.keys(colorSchemes),
      activeScheme: "Rainbow",
      marker: [-0.8, 0.156],
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
      console.log(this.marker);
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
  width: 40vmin;
  height: 40vmin;
  border-radius: $pad;
  overflow: hidden;

  #mandelbrot {
    width: 100%;
    height: 100%;
    opacity: 0.95;
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