<template lang="pug">
#container
  Littlewood#littlewood(ref="littlewood")
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Littlewood from "../components/Littlewood.vue";
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
    Littlewood,
  },
  data() {
    return {
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
        const image: ImageData = await (this.$refs.littlewood as any).generateImage(
          getDownloadSize()
        );

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