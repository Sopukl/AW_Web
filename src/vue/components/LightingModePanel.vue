<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from "vue";
import { projectKey } from "../stores/keys";
import { State } from "../../core/SubgineryState";
import {
  Page,
  SubgineryLightingState
} from "../../core/enginery/Lighting/SubgineryLightingState";

const project = inject(projectKey);
if (!project)
  throw new Error("Project store is not provided");

const version = ref(0);
let observedState: SubgineryLightingState | null = null;
const changed = (): void => { version.value++; };

const currentLocation = computed(() =>
  project.locations.value.find(
    (location: any) => location.id === project.currentLocationId.value
  ) ?? null
);
const hasLighting = computed(() =>
  currentLocation.value?.subgineries?.has("Lighting") === true
);
const lightingState = computed(() => {
  const currentProject = project.current.value as any;
  const state = currentProject?.subgineryState("Lighting");
  return state instanceof SubgineryLightingState ? state : null;
});

function unsubscribe(): void {
  observedState?.removeEventListener("stateChanged", changed);
  observedState?.removeEventListener("pageChanged", changed);
  observedState = null;
}

watch(lightingState, (state) => {
  unsubscribe();
  observedState = state;
  observedState?.addEventListener("stateChanged", changed);
  observedState?.addEventListener("pageChanged", changed);
}, { immediate: true });
onBeforeUnmount(unsubscribe);

const state = computed(() => {
  version.value;
  return lightingState.value?.state;
});
const page = computed(() => {
  version.value;
  return lightingState.value?.page;
});

function setState(value: State): void {
  if (lightingState.value)
    lightingState.value.state = value;
}

function setPage(value: Page): void {
  if (lightingState.value)
    lightingState.value.page = value;
}
</script>

<template>
  <aside v-if="hasLighting && lightingState" class="lighting-mode-panel">
    <div class="lighting-mode-group" aria-label="Режим подсистемы света">
      <button
        v-for="value in [State.Hidden, State.Normal, State.Monopoly]"
        :key="value"
        type="button"
        :class="{ active: state === value }"
        @click="setState(value)"
      >{{ value }}</button>
    </div>
    <div class="lighting-mode-group" aria-label="Страница подсистемы света">
      <button
        v-for="value in [Page.Light, Page.Sensors, Page.Area]"
        :key="value"
        type="button"
        :class="{ active: page === value }"
        @click="setPage(value)"
      >{{ value }}</button>
    </div>
  </aside>
</template>
