<template lang="pug">
#container
  a.back-button(href="./index.html")
    i.bi.bi-box-arrow-left

  SidePanel(icon="bi-info", position="bottom right", :open="true")
    form.p-3(@submit.prevent)
      h3 {{ $t('newton.title') }}

      .input-group
        span.input-group-text f(z) =
        input.form-control(
          type="text",
          :class="{ 'is-invalid': !!errorMessage }",
          :value="formula",
          @change="(e) => (formula = e.target.value)"
        )
        .invalid-feedback {{ errorMessage }}

      p(v-html="$t('newton.info')")
      p {{ $t('newton.interesting_functions') }}
      ul
        li(v-for="value in interesting")
          a(href="#", @click.prevent="formula = value")
            | f(z) = {{ value }}

      label.form-check.form-switch
        input.form-check-input(type="checkbox", v-model="axes")
        .form-check-label {{ $t('general.show_axes') }}

      label.form-check.form-switch
        input.form-check-input(type="checkbox", v-model="shadeSmooth")
        .form-check-label {{ $t('general.shade_smooth') }}

      label.form-check.form-switch
        input.form-check-input(type="checkbox", v-model="showRoots")
        .form-check-label {{ $t('general.show_roots') }}

      button.btn.btn-secondary(type="button", @click.prevent="resetView") {{ $t('general.reset_view') }}

  Newton#newton(
    :colorScheme="activeScheme",
    ref="newton",
    :f="shader",
    :axes="axes",
    :shadeSmooth="shadeSmooth",
    :showRoots="showRoots"
  )
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Newton from "../components/Newton.vue";
import ComplexNumber from "../components/ComplexNumber.vue";
import SidePanel from "../components/SidePanel.vue";
import downloadImage from "../util/downloadImage";
import * as parser from "../util/complexParser";
import * as math from "mathjs";
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
    Newton,
    SidePanel,
    ComplexNumber,
    ColorSchemePicker,
  },
  data() {
    return {
      activeScheme: "UGent",
      axes: false,
      loadingDownload: false,
      shadeSmooth: false,
      showRoots: false,
      formula: "z^5 - 1",
      interesting: ["z^5 - 1", "cos(z)", "z^3 - 1", "z^-3 - z"],
      shader: null as null | string,
      errorMessage: "",
    };
  },
  watch: {
    formula: {
      immediate: true,
      handler(formula: string) {
        try {
          const tree = math.parse(formula);

          this.shader = `
          ${parser.shaderHeader}
          vec2 f(vec2 z) {
            return (${parser.compile(tree, ["z"])});
          }

          vec2 df(vec2 z) {
            return (${parser.compile(math.derivative(tree, "z"), ["z"])});
          }
        `;
          this.errorMessage = "";
        } catch (e) {
          if (e instanceof Error) {
            this.errorMessage = e.message;
            console.warn(e);
          } else throw e;
        }
      },
    },
  },
  methods: {
    resetView() {
      (this.$refs.newton as any).resetView();
    },
    async downloadImage() {
      try {
        this.loadingDownload = true;
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
        const image: ImageData = await (this.$refs.newton as any).generateImage(
          getDownloadSize()
        );

        let filename = "newton";

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