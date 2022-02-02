<template lang="pug">
#container
  SidePanel(icon="bi-list", position="top right")
    form.p-3
      fieldset
        legend Romeo
        .form-label Colour scheme
        .ps-3
          label.form-check(v-for="scheme of colorSchemes")
            input.form-check-input(
              type="radio",
              v-model="activeScheme",
              :value="scheme"
            )
            span.form-check-label {{ scheme }}

      hr 

      button.btn.btn-link.disabled(
        v-if="loadingDownload",
        type="button",
        @click.prevent="",
        disabled
      ) Loading image...
      button.btn.btn-link(
        v-else,
        type="button",
        @click.prevent="downloadImage"
      ) Download image

      button.btn.btn-secondary(type="button", @click.prevent="resetView") Reset view

  SidePanel(icon="bi-info", position="bottom left")
    .p-3
      p Test
      p more Test
      ul
        li item
        li item
        li item

  Julia#julia(:colorScheme="activeScheme", ref="julia", :c="marker")
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
import SidePanel from "./components/SidePanel.vue";
import { colorSchemes } from "./util/ColorScheme";
import downloadImage from "./util/downloadImage";

const getDownloadSize = (() => {
  const w = window as any;
  w.downloadSize = 4096;

  const gl = document
    .createElement("canvas")
    .getContext("webgl2") as WebGL2RenderingContext;
  const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  console.log(
    `The maximum possible image size is ${maxSize} by ${maxSize} pixels. ` +
      `The current value is ${w.downloadSize}. ` +
      `To change this value execute \`window.downloadSize = 8196;\`.`
  );

  return () => {
    return Math.min(w.downloadSize, maxSize);
  };
})();

export default defineComponent({
  components: {
    Julia,
    SidePanel,
    Mandelbrot,
    ComplexNumber,
  },
  data() {
    return {
      colorSchemes: Object.keys(colorSchemes),
      activeScheme: "UGent",
      marker: [-0.124, -0.713],
      isMounted: false,
      loadingDownload: false,
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
    resetView() {
      (this.$refs.mandelbrot as any).resetView();
      (this.$refs.julia as any).resetView();
    },
    async downloadImage() {
      try {
        this.loadingDownload = true;
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        const image: ImageData = await (this.$refs.julia as any).generateImage(
          getDownloadSize()
        );

        let filename = "julia." + this.marker[0].toFixed(8);
        const b = this.marker[1].toFixed(8) + "i";
        if (!b.startsWith("-")) filename += "+";
        filename += b;

        downloadImage(image, filename);
      } finally {
        this.loadingDownload = false;
      }
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