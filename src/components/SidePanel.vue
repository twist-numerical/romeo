<template lang="pug">
.side-panel(:class="sidePanelClasses")
  i.side-panel-button.bi.bi-list(:class="[icon]", @click="open = !open")
  .side-panel-container
    .side-panel-content
      slot
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    icon: {
      type: String,
      default: "bi-list",
    },
    position: {
      type: String,
      default: "top right",
    },
  },
  computed: {
    sidePanelClasses() {
      const a = this.position.split(" ").map((v) => "side-panel-" + v);
      if (this.open) a.push("side-panel-open");
      return a;
    },
  },
  data() {
    return { open: true };
  },
});
</script>


<style lang="scss">
@import "../style/vars.scss";

.side-panel {
  $width: min(300px, 30vw);
  $background: rgba(255, 255, 255, 0.9);

  position: absolute;
  width: auto;
  overflow: visible;
  box-sizing: content-box;

  .side-panel-button {
    position: absolute;
    width: 5 * $pad;
    background: $background;
    border-radius: $pad;
    font-size: 4 * $pad;
    line-height: 5 * $pad;
    text-align: center;
  }

  .side-panel-container {
    overflow: hidden;
    width: 0;
    transition: width 1s ease-in-out;

    .side-panel-content {
      width: $width;
      background: $background;
      border-radius: $pad;
      overflow: hidden;
    }
  }

  &.side-panel-left {
    left: 0;

    .side-panel-button {
      right: -6 * $pad;
    }
    .side-panel-content {
      float: right;
      margin: 0 0 0 $pad;
    }
  }

  &.side-panel-right {
    right: 0;

    .side-panel-button {
      left: -6 * $pad;
    }
    .side-panel-content {
      margin: 0 $pad 0 0;
    }
  }

  &.side-panel-top {
    top: $pad;

    .side-panel-button {
      top: 0;
    }
  }

  &.side-panel-bottom {
    bottom: $pad;

    .side-panel-button {
      bottom: 0;
    }
  }

  &.side-panel-open .side-panel-container {
    width: calc($width + $pad);
  }
}
</style>
