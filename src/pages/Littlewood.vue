<template lang="pug">
#container
  a.back-button(href="./index.html")
    i.bi.bi-box-arrow-left
  SidePanel(icon="bi-list", position="top right")
    form.p-3
      h3 {{ $t('littlewood.title') }}

      //
        .form-label {{ $t('general.color_scheme') }}
        ColorSchemePicker.ps-3(v-model="activeScheme")

      hr 

      //
        button.btn.btn-link.disabled(
          v-if="loadingDownload",
          type="button",
          @click.prevent="",
          disabled
        ) {{ $t('general.image_loading') }}
      //
        button.btn.btn-link(
          v-else,
          type="button",
          @click.prevent="downloadImage"
        ) {{ $t('general.download_image') }}

      button.btn.btn-secondary(type="button", @click.prevent="resetView") {{ $t('general.reset_view') }}

  Littlewood#littlewood(ref="littlewood", :colorScheme="activeScheme")
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Littlewood from "../components/Littlewood.vue";
import downloadImage from "../util/downloadImage";
import SidePanel from "../components/SidePanel.vue";
import ColorSchemePicker from "../components/ColorSchemePicker.vue";

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
    Littlewood,
    SidePanel,
    ColorSchemePicker,
  },
  data() {
    return {
      activeScheme: "Soft rainbow",
      loadingDownload: false,
    };
  },
  methods: {
    resetView() {
      (this.$refs.littlewood as any).resetView();
    },
    async downloadImage() {
      try {
        this.loadingDownload = true;
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        const image: ImageData = await (
          this.$refs.littlewood as any
        ).generateImage(getDownloadSize());

        let filename = "littlewood";

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
#littlewood {
  width: 100%;
  height: 100%;
}
</style>