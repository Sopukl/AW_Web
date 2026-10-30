<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from "vue";
import { projectKey } from "../stores/keys";
import { State } from "../../core/SubgineryState";
import {
  Page,
  SubgineryLightingState
} from "../../core/enginery/Lighting/SubgineryLightingState";
import onIcon from "../../assets/Subginery/Lighting/Subginery/On.svg";
import scene1Icon from "../../assets/Subginery/Lighting/Subginery/Scene1.svg";
import scene2Icon from "../../assets/Subginery/Lighting/Subginery/Scene2.svg";
import offIcon from "../../assets/Subginery/Lighting/Subginery/Off.svg";

const project = inject(projectKey);
if (!project)
  throw new Error("Project store is not provided");

const version = ref(0);
const lightButtons = [
  { name: "On", icon: onIcon },
  { name: "Scene 1", icon: scene1Icon },
  { name: "Scene 2", icon: scene2Icon },
  { name: "Off", icon: offIcon }
];
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
const pageDirection = ref<"up" | "down">("up");
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
  pageDirection.value = "up";
  if (page.value === Page.Light)
    setPage(Page.Sensors);
  else if (page.value === Page.Sensors)
    setPage(Page.Area);
}

function decreasePage(): void {
  pageDirection.value = "down";
  if (page.value === Page.Area)
    setPage(Page.Sensors);
  else if (page.value === Page.Sensors)
    setPage(Page.Light);
}
</script>

<template>
  <aside
    v-if="hasLighting && lightingState"
    class="lighting-mode-panel"
    :class="{
      'state-hidden': state === State.Hidden,
      'state-normal': state === State.Normal,
      'state-monopoly': state === State.Monopoly
    }"
  >
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
        <div class="lighting-page-viewport">
          <Transition :name="'lighting-page-' + pageDirection">
            <div :key="page" class="lighting-page-panel">
              <div v-if="page === Page.Light" class="lighting-mode-column">
                <button
                  v-for="button in lightButtons"
                  :key="button.name"
                  type="button"
                  :aria-label="button.name"
                  :title="button.name"
                >
                  <img :src="button.icon" alt="">
                </button>
              </div>
              <div v-else-if="page === Page.Sensors" class="lighting-mode-column">
                <input v-model.number="sliderOne" type="range" min="0" max="2" step="1">
                <input v-model.number="sliderTwo" type="range" min="0" max="2" step="1">
              </div>
              <div v-else class="lighting-mode-empty" aria-label="Area"></div>
            </div>
          </Transition>
        </div>
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
