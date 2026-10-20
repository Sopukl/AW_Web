<script setup lang="ts">
import { SettingsDialog as Dialog } from "./legacy/SettingsDialog";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <Dialog :open="open" @close="emit('close')" />
</template>
