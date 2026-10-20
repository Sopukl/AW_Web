import { ref, onScopeDispose } from "vue";
import type { EngineryStore } from "../../core/EngineryStore";

export function useEngineryStore(coreStore: EngineryStore) {
  const version = ref(coreStore.version);
  const unsubscribe = coreStore.subscribe((value: number) => { version.value = value; });
  onScopeDispose(unsubscribe);
  return { core: coreStore, version };
}

export type VueEngineryStore = ReturnType<typeof useEngineryStore>;
