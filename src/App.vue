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

  Julia#julia(:colorScheme="activeScheme")
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Julia from "./components/Julia.vue";
import Hamburger from "./components/Hamburger.vue";
import { colorSchemes } from "./util/ColorScheme";

export default defineComponent({
  components: {
    Julia,
    Hamburger,
  },
  data() {
    return {
      colorSchemes: Object.keys(colorSchemes),
      activeScheme: "rainbow",
    };
  },
});
</script>

<style>
html,
body,
#container,
#app,
#julia {
  width: 100%;
  height: 100%;
  margin: 0;
}
</style>