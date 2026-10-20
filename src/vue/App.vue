<script setup lang="ts">
import { provide, ref } from "vue";
import ConnectionDialog from "./components/ConnectionDialog.vue";
import SettingsDialog from "./components/SettingsDialog.vue";
import ThreePanel from "./components/ThreePanel.vue";
import { EngineryStore } from "../core/EngineryStore";
import { useEngineryStore } from "./stores/useEngineryStore";
import { useProject } from "./stores/useProject";
import { useConnection } from "./stores/useConnection";
import { connectionKey, projectKey, engineryKey } from "./stores/keys";

const enginery = useEngineryStore(new EngineryStore());
const project = useProject();
const connection = useConnection(project, enginery);
const settingsOpen = ref(false);

provide(connectionKey, connection);
provide(projectKey, project);
provide(engineryKey, enginery);
</script>

<template>
  <main v-if="connection.connected.value" class="workspace">
    <ThreePanel @settings="settingsOpen = true" />
  </main>
  <SettingsDialog :open="settingsOpen" @close="settingsOpen = false" />
  <ConnectionDialog />
</template>
