<template lang="pug">
div
  Julia.background(
    colorScheme="Gray",
    :c="c",
    :moveable="false",
    :center="[0.5, 0.5]",
    :zoom="1"
  )

  .container
    .row
      .col
        h1.mt-5 Romeo
    .row
      .col.p-5
        .card
          img.card-img-top(src="../assets/julia.png")
          .card-body
            h5.card-title {{ $t('julia.title') }}
            p.card-text
              | {{ $t('julia.subtitle') }}
            a.card-link.stretched-link(href="julia.html") {{ $t('julia.overview_link') }}

      .col.p-5
        .card
          img.card-img-top(src="../assets/newton.png")
          .card-body
            h5.card-title {{ $t('newton.title') }}
            p.card-text
              | {{ $t('newton.subtitle') }}
            a.card-link.stretched-link(href="newton.html") {{ $t('newton.overview_link') }}
      
      .col.p-5
        .card
          img.card-img-top(src="../assets/littlewood.png")
          .card-body
            h5.card-title {{ $t('littlewood.title') }}
            p.card-text
              | {{ $t('littlewood.subtitle') }}
            a.card-link.stretched-link(href="littlewood.html") {{ $t('littlewood.overview_link') }}
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Julia from "../components/Julia.vue";

export default defineComponent({
  components: {
    Julia,
  },
  data() {
    return {
      offset: Math.random() * Math.PI * 2,
      t: 0,
      mountID: 0,
    };
  },
  computed: {
    c() {
      const t = (this as any).t as number;
      const a = (this as any).offset + 0.000003 * t;
      const r = 0.8;
      return [-0.25 + r * Math.cos(a), r * Math.sin(a)];
    },
  },
  mounted() {
    const mountID = ++this.mountID;
    const start = performance.now();
    const maxFPS = 20;
    let last = 0;
    const update = () => {
      if (mountID != this.mountID) return;
      const t = performance.now();
      if (t - last > 1000 / maxFPS) {
        last = t;
        this.t = t - start;
      }
      requestAnimationFrame(update);
    };
    update();
  },
  unmounted() {
    ++this.mountID;
  },
});
</script>

<style lang="scss">
@import "../style/vars.scss";

.background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  opacity: 0.5;
}
</style>