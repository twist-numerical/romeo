<template lang="pug">
div
  label.form-check(v-for="scheme of schemesList")
    input.form-check-input(
      type="radio",
      v-model="activeScheme",
      @change="$emit('update:modelValue', $event.target.value)",
      :value="scheme.name"
    )
    span.form-check-label {{ $te(scheme.translationKey) ? $t(scheme.translationKey) : scheme.name }}
</template>


<script lang="ts">
import { defineComponent } from "vue";
import { colorSchemes } from "@/util/ColorScheme";

export default defineComponent({
  props: {
    schemes: {
      type: Array,
      default: () => Object.keys(colorSchemes),
    },
    modelValue: {
      default: "Soft rainbow",
    },
  },
  emits: ["update:modelValue"],
  data() {
    return { activeScheme: this.modelValue };
  },
  computed: {
    schemesList() {
      return (this.schemes as string[]).map((k: string) => colorSchemes[k]);
    },
  },
  watch: {
    value() {
      this.activeScheme = this.modelValue;
    },
  },
});
</script>
