import { ProjectThreeView } from "../../three/ProjectThreeView.js";
import { projectKey, engineryKey } from "../stores/keys.js";
import { LocationBreadcrumb } from "./LocationBreadcrumb.js";

const { inject, ref, watch, onMounted, onBeforeUnmount, nextTick } = globalThis.Vue;

export const ThreePanel = {
  components: { LocationBreadcrumb },
  emits: ["settings"],
  setup() {
    const project = inject(projectKey);
    const enginery = inject(engineryKey);
    const container = ref(null);
    let view = null;

    function dispose() {
      if (view)
        view.dispose();
      view = null;
    }

    async function create(model) {
      dispose();
      if (!model)
        return;
      await nextTick();
      try {
        view = new ProjectThreeView(
          container.value, model, enginery.core, project.colorScheme.value
        );
        view.onNavigate = (id) => { project.currentLocationId.value = id; };
        const first = model.locations.find((location) =>
          location.id === model.rootLocationID && location.arrangements?.length
        ) || model.locations.find((location) => location.arrangements?.length);
        if (first) {
          view.goToLocation(first.id, false);
          view.currentLocationId = first.id;
          project.currentLocationId.value = first.id;
        }
      } catch (error) {
        project.view3dError.value = error.message || String(error);
      }
    }

    onMounted(() => create(project.current.value));
    watch(project.current, create);
    watch(project.currentLocationId, (id) => {
      if (view && id !== null && id !== view.currentLocationId) {
        view.goToLocation(id, true);
        view.currentLocationId = id;
      }
    });
    watch(project.colorScheme, (name) => { if (view) view.setColorScheme(name); });
    onBeforeUnmount(dispose);
    return { project, container };
  },
  template: `
    <section class="panel three-view">
      <div class="three-stage">
        <LocationBreadcrumb />
        <div id="three-view-container" ref="container"></div>
        <div v-if="project.view3dError.value" class="three-message error">{{ project.view3dError.value }}</div>
        <div v-else-if="!project.locations.value.length" class="three-message">В проекте нет локаций.</div>
        <button type="button" class="awada-settings-button" @click="$emit('settings')">AWADA</button>
      </div>
    </section>`
};
