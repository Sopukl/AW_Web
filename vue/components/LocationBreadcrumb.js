import { projectKey } from "../stores/keys.js";
const { inject } = globalThis.Vue;

export const LocationBreadcrumb = {
  setup() {
    const project = inject(projectKey);
    const select = (id, event) => {
      project.currentLocationId.value = id;
      const details = event.currentTarget.closest("details");
      if (details)
        details.open = false;
    };
    const closeOthers = (event) => {
      if (!event.currentTarget.open)
        return;
      event.currentTarget.closest(".location-breadcrumb")
        .querySelectorAll(".location-step[open]")
        .forEach((item) => { if (item !== event.currentTarget) item.open = false; });
    };
    return { project, select, closeOthers };
  },
  template: `
    <nav class="location-breadcrumb" aria-label="Путь по локациям">
      <template v-for="(step, index) in project.navigationPath.value" :key="step.node.location.id">
        <span v-if="index" class="breadcrumb-separator" aria-hidden="true">›</span>
        <details class="location-step" @toggle="closeOthers">
          <summary :class="{ active: index === project.navigationPath.value.length - 1 }">
            {{ step.node.location.titleText }}
          </summary>
          <div class="location-tree-popup" role="tree">
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
        </details>
      </template>
    </nav>`
};
