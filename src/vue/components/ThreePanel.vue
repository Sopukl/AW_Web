<script setup lang="ts">
import { ThreePanel as Panel } from "./legacy/ThreePanel";

const emit = defineEmits<{ settings: [] }>();
</script>

<template>
  <Panel @settings="emit('settings')" />
</template>
