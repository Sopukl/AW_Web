// @ts-nocheck
import { inject, ref } from "vue";
import { projectKey } from "../../stores/keys";

export const SettingsDialog = {
  props: { open: Boolean },
  emits: ["close"],
  setup() {
    const project = inject(projectKey);
    const selected = ref("Язык");
    const sections = [
      "Язык", "Загрузка проектов", "Цветовая схема", "Интерфейс",
      "Сеть", "Настройки проекта", "О приложении"
    ];
    return { project, selected, sections };
  },
  template: `
    <div v-if="open" class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <section class="settings-content">
        <header class="settings-header">
          <h2 id="settings-title">Настройки</h2>
          <button type="button" class="settings-close" aria-label="Закрыть настройки" @click="$emit('close')">×</button>
        </header>
        <div class="settings-layout">
          <main class="settings-page" :class="{ 'settings-page-list': selected === 'Цветовая схема' }">
            <h3 v-if="selected !== 'Цветовая схема'">{{ selected }}</h3>
            <div v-else class="settings-options" aria-label="Цветовая схема">
              <button v-for="scheme in ['Awada', 'Default']" :key="scheme" type="button"
                :class="{ active: project.colorScheme.value === scheme }"
                @click="project.colorScheme.value = scheme">{{ scheme }}</button>
            </div>
          </main>
          <nav class="settings-sections" aria-label="Разделы настроек">
            <button v-for="section in sections" :key="section" type="button"
              :class="{ active: selected === section }" @click="selected = section">{{ section }}</button>
          </nav>
        </div>
      </section>
    </div>`
};
