<template lang="pug">
.hamburger-menu(:class="{ open: open }")
  i.hamburger-button.bi.bi-list(@click="open = !open")
  .hamburger-container
    .hamburger-content
      slot
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return { open: true };
  },
});
</script>


<style lang="scss">
@import "../style/vars.scss";

.hamburger-menu {
  $width: min(300px, 30vw);
  $background: rgba(255, 255, 255, 0.9);

  position: absolute;
  top: $pad;
  right: 0;
  width: auto;
  overflow: visible;
  box-sizing: content-box;

  .hamburger-button {
    position: absolute;
    left: -6 * $pad;
    width: 5 * $pad;
    background: $background;
    border-radius: $pad;
    font-size: 4 * $pad;
    line-height: 5 * $pad;
    text-align: center;
  }

  .hamburger-container {
    overflow: hidden;
    width: 0;
    transition: width 1s ease-in-out;

    .hamburger-content {
      width: $width;
      background: $background;
      border-radius: $pad;
      overflow: hidden;
      margin: 0 $pad 0 0;
    }
  }

  &.open .hamburger-container {
    width: calc($width + $pad);
  }
}
</style>
