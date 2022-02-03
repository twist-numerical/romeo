<template lang="pug">
#container(
  @mousemove="onMove",
  @mouseup="onEnd",
  @mouseleave="onEnd",
  @touchmove="onMove",
  @touchend="onEnd"
)
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

      label.form-check.form-switch
        input.form-check-input(type="checkbox", v-model="axes")
        .form-check-label Show axes

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

  SidePanel(icon="bi-info", position="bottom right", :open="true")
    .p-3
      p Test
      p A few interesting valeus for c.
      ul
        li(v-for="value in interesting")
          a(href="#", @click.prevent="marker = value")
            ComplexNumber(:value="value")

  Julia#julia(
    :colorScheme="activeScheme",
    ref="julia",
    :c="marker",
    :axes="axes"
  )

  .mandelbrot-container
    .mandelbrot-resize
      div(
        style="transform: scaleX(-1)",
        @mousedown="(e) => (rescalePosition = [e.clientX, e.clientY])",
        @touchstart="onStart"
      )
        i.bi.bi-arrows-angle-expand
    .mandelbrot-content
      .position-relative.h-100
        Mandelbrot#mandelbrot(
          :style="{ width: mandelbrotSize + 'px', height: mandelbrotSize + 'px' }",
          ref="mandelbrot",
          colorScheme="Gray",
          :axes="axes",
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
import ComplexPlane from "./components/ComplexPlane.vue";

function clamp(a: number, min: number, max: number) {
  return a < min ? min : a > max ? max : a;
}

type CPlane = InstanceType<typeof ComplexPlane>;

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
      axes: false,
      loadingDownload: false,
      interesting: [
        [-0.124, -0.713],
        [0, 0],
        [-0.618, 0.0],
        [0.226, 0.539],
        [0.285, -0.014],
        [-0.8, 0.156],
      ],
      size: [100, 100],
      rescalePosition: null as [number, number] | null,
      mandelbrotSizeRatio: 0.4,
      resizeListener: () => {},
    };
  },
  mounted() {
    this.isMounted = true;
    this.resizeListener = () => {
      this.size = [window.innerWidth, window.innerHeight];
    };
    this.resizeListener();
    window.addEventListener("resize", this.resizeListener);
  },
  unmounted() {
    this.isMounted = false;
    window.removeEventListener("resize", this.resizeListener);
  },
  computed: {
    bullseye() {
      if (!this.isMounted) return { left: 0, right: 0 };
      const plane = (
        (this.$refs.mandelbrot as any).$refs.complexPlane as CPlane
      ).complexPlane;

      const [x, y] = (this as any).marker;
      const [cx, cy] = plane.center as [number, number];
      return {
        left: plane.vmin * (0.5 + (x - cx) / plane.zoom) + "px",
        top: plane.vmin * (0.5 + (cy - y) / plane.zoom) + "px",
      };
    },
    mandelbrotSize() {
      const t = this as any;
      return t.mandelbrotSizeRatio * Math.min(t.size[0], t.size[1]);
    },
  },
  watch: {
    async mandelbrotSize() {
      await this.$nextTick();
      (
        this.$refs.mandelbrot as any
      ).$refs.complexPlane.$refs.webglCanvas.resize();
    },
  },
  methods: {
    onStart(event: MouseEvent | TouchEvent) {
      if (event instanceof MouseEvent) {
        event.preventDefault();
        this.rescalePosition = [event.clientX, event.clientY];
      } else if (event.touches.length == 1) {
        event.preventDefault();
        this.rescalePosition = [
          event.touches[0].clientX,
          event.touches[0].clientY,
        ];
      }
    },
    onMove(event: MouseEvent | TouchEvent) {
      if (!this.rescalePosition) return;

      event.preventDefault();

      let p: [number, number];
      if (event instanceof MouseEvent) p = [event.clientX, event.clientY];
      else {
        if (event.touches.length != 1) {
          this.rescalePosition = null;
          return;
        }
        p = [event.touches[0].clientX, event.touches[0].clientY];
      }

      const i = this.size[0] < this.size[0] ? 0 : 1;
      const v = (this.mandelbrotSizeRatio * p[i]) / this.rescalePosition[i];
      if (0.1 < v && v < 0.8) {
        this.mandelbrotSizeRatio = v;
        this.rescalePosition = p;
      }
    },
    onEnd() {
      this.rescalePosition = null;
    },
    placeMarker(event: MouseEvent) {
      const plane = (
        (this.$refs.mandelbrot as any).$refs.complexPlane as CPlane
      ).complexPlane;
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

.mandelbrot-container {
  position: absolute;
  top: $pad;
  left: $pad;

  .mandelbrot-resize {
    position: absolute;
    bottom: -4 * $pad;
    right: -4 * $pad;
    border-radius: $pad;
    background: $panel-background;

    i.bi {
      display: block;
      padding: $pad;
      width: 4 * $pad;
      font-size: 2 * $pad;
      line-height: 2 * $pad;
      text-align: center;
    }
  }

  .mandelbrot-content {
    border-radius: $pad;
    overflow: hidden;
  }

  #mandelbrot {
    border-radius: $pad;
    opacity: 0.9;
    overflow: hidden;
  }

  .mandelbrot-info {
    position: absolute;
    background: rgba(255, 255, 255, 0.4);
    border-radius: $pad 0 $pad 0;
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