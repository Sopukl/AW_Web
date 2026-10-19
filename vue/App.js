import { ConnectionDialog } from "./components/ConnectionDialog.js";
import { SettingsDialog } from "./components/SettingsDialog.js";
import { ThreePanel } from "./components/ThreePanel.js";
import { connectionKey, projectKey, engineryKey } from "./stores/keys.js";

const { provide, ref } = globalThis.Vue;

export function createAppComponent(stores) {
  return {
    components: { ConnectionDialog, SettingsDialog, ThreePanel },
    setup() {
      provide(connectionKey, stores.connection);
      provide(projectKey, stores.project);
      provide(engineryKey, stores.enginery);
      const settingsOpen = ref(false);
      return { stores, settingsOpen };
    },
    template: `
      <main v-if="stores.connection.connected.value" class="workspace">
        <ThreePanel @settings="settingsOpen = true" />
      </main>
      <SettingsDialog :open="settingsOpen" @close="settingsOpen = false" />
      <ConnectionDialog />`
  };
}
