<template lang="pug">
span.complex-number {{ asString }}
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    value: {
      type: Array as unknown as PropType<[number, number]>,
      default: () => [0, 0],
    },
    precision: { type: Number, default: 3 },
  },
  computed: {
    asString() {
      const n2s = (v: number): [string, string] => {
        const r = v.toFixed(this.precision);
        if (r.startsWith("-")) {
          return ["-", r.substring(1)];
        } else {
          return ["+", r];
        }
      };

      let [sa, a] = n2s(this.value[0]);
      const [sb, b] = n2s(this.value[1]);

      if (sa == "-") a = "-" + a;
      return `${a} ${sb} ${b}i`;
    },
  },
});
</script>
