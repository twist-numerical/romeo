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

      label.form-check.form-switch
        input.form-check-input(type="checkbox", v-model="axes")
        .form-check-label Show axes

      label.form-check.form-switch
        input.form-check-input(type="checkbox", v-model="shadeSmooth")
        .form-check-label Shade smooth

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

  Newton#newton(:colorScheme="activeScheme", ref="newton", :axes="axes" :shadeSmooth="shadeSmooth")
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Newton from "../components/Newton.vue";
import ComplexNumber from "../components/ComplexNumber.vue";
import SidePanel from "../components/SidePanel.vue";
import { colorSchemes } from "../util/ColorScheme";
import downloadImage from "../util/downloadImage";

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
    Newton,
    SidePanel,
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
      shadeSmooth: false,
    };
  },
  mounted() {
    this.isMounted = true;
  },
  unmounted() {
    this.isMounted = false;
  },
  methods: {
    resetView() {
      (this.$refs.newton as any).resetView();
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
@import "../style/vars.scss";

html,
body,
#container,
#app,
#newton {
  width: 100%;
  height: 100%;
}
</style>