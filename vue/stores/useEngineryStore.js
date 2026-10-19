const { ref, onScopeDispose } = globalThis.Vue;

export function useEngineryStore(coreStore) {
  const version = ref(coreStore.version);
  const unsubscribe = coreStore.subscribe((value) => { version.value = value; });
  onScopeDispose(unsubscribe);
  return { core: coreStore, version };
}
