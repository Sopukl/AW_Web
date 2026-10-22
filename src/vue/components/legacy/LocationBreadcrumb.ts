// @ts-nocheck
import { inject, ref } from "vue";
import { projectKey } from "../../stores/keys";

export const LocationBreadcrumb = {
  setup() {
    const project = inject(projectKey);
    const openStepId = ref(null);
    const select = (id, event) => {
      if (project.currentLocationId.value === id)
        return;
      project.currentLocationId.value = id;
      openStepId.value = null;
    };
    const toggleStep = (id) => {
      openStepId.value = openStepId.value === id ? null : id;
    };
    return { project, openStepId, select, toggleStep };
  },
  template: `
    <nav class="location-breadcrumb" aria-label="Путь по локациям">
      <template v-for="(step, index) in project.navigationPath.value" :key="step.node.location.id">
        <span v-if="index" class="breadcrumb-separator" aria-hidden="true">›</span>
        <div class="location-step">
          <div class="location-step-control"
            :class="{ active: index === project.navigationPath.value.length - 1 }">
            <button type="button" class="location-step-title"
              :disabled="project.currentLocationId.value === step.node.location.id"
              @click="select(step.node.location.id, $event)">
              {{ step.node.location.titleText }}
            </button>
            <button type="button" class="location-step-toggle"
              :aria-expanded="openStepId === step.node.location.id"
              aria-label="Показать дерево локаций"
              @click="toggleStep(step.node.location.id)">
              {{ openStepId === step.node.location.id ? '▾' : '▸' }}
            </button>
          </div>
          <div v-if="openStepId === step.node.location.id" class="location-tree-popup" role="tree">
            <div v-for="item in step.items" :key="item.location.id" class="location-tree-row"
              :style="{ '--tree-depth': item.depth }" role="treeitem" :aria-level="item.depth + 1">
              <button v-if="item.children.length" type="button" class="tree-toggle"
                @click.stop="project.toggleLocation(item.location.id)">
                {{ project.expandedLocations.value[String(item.location.id)] ? '▾' : '▸' }}
              </button>
              <span v-else class="tree-spacer"></span>
              <button type="button" class="location-button"
                :class="{ active: project.currentLocationId.value === item.location.id }"
                :disabled="!item.location.arrangements || !item.location.arrangements.length"
                @click="select(item.location.id, $event)">
                <span>{{ item.location.titleText }}</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </nav>`
};
