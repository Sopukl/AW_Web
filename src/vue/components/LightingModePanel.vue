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
const sliderOne = ref(1);
const sliderTwo = ref(1);
const canIncrease = computed(() =>
  state.value === State.Hidden || state.value === State.Normal
);
const canDecrease = computed(() =>
  state.value === State.Normal || state.value === State.Monopoly
);
const canIncreasePage = computed(() =>
  page.value === Page.Light || page.value === Page.Sensors
);
const canDecreasePage = computed(() =>
  page.value === Page.Sensors || page.value === Page.Area
);

function increaseState(): void {
  if (!lightingState.value)
    return;
  if (state.value === State.Hidden)
    lightingState.value.state = State.Normal;
  else if (state.value === State.Normal)
    lightingState.value.state = State.Monopoly;
}

function decreaseState(): void {
  if (!lightingState.value)
    return;
  if (state.value === State.Monopoly)
    lightingState.value.state = State.Normal;
  else if (state.value === State.Normal)
    lightingState.value.state = State.Hidden;
}

function setPage(value: Page): void {
  if (lightingState.value)
    lightingState.value.page = value;
}

function increasePage(): void {
  if (page.value === Page.Light)
    setPage(Page.Sensors);
  else if (page.value === Page.Sensors)
    setPage(Page.Area);
}

function decreasePage(): void {
  if (page.value === Page.Area)
    setPage(Page.Sensors);
  else if (page.value === Page.Sensors)
    setPage(Page.Light);
}
</script>

<template>
  <aside v-if="hasLighting && lightingState" class="lighting-mode-panel">
    <div class="lighting-mode-content">
      <div v-if="state === State.Normal" class="lighting-mode-column">
        <input v-model.number="sliderOne" type="range" min="0" max="2" step="1">
        <input v-model.number="sliderTwo" type="range" min="0" max="2" step="1">
      </div>

      <template v-else-if="state === State.Monopoly">
        <button
          type="button"
          class="lighting-page-arrow lighting-page-arrow-up"
          aria-label="Увеличить страницу"
          :disabled="!canIncreasePage"
          @click="increasePage"
        >▲</button>
        <div v-if="page === Page.Light" class="lighting-mode-column">
          <button v-for="number in 4" :key="number" type="button">{{ number }}</button>
        </div>
        <div v-else-if="page === Page.Sensors" class="lighting-mode-column">
          <input v-model.number="sliderOne" type="range" min="0" max="2" step="1">
          <input v-model.number="sliderTwo" type="range" min="0" max="2" step="1">
        </div>
        <div v-else class="lighting-mode-empty" aria-label="Area"></div>
        <button
          type="button"
          class="lighting-page-arrow lighting-page-arrow-down"
          aria-label="Уменьшить страницу"
          :disabled="!canDecreasePage"
          @click="decreasePage"
        >▼</button>
      </template>
    </div>

    <div class="lighting-state-arrows" aria-label="Режим подсистемы света">
      <button
        type="button"
        aria-label="Увеличить режим"
        :disabled="!canIncrease"
        @click="increaseState"
      >▶</button>
      <button
        type="button"
        aria-label="Уменьшить режим"
        :disabled="!canDecrease"
        @click="decreaseState"
      >◀</button>
    </div>
  </aside>
</template>
