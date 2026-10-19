const { ref, computed } = globalThis.Vue;

export function useProject() {
  const current = ref(null);
  const currentLocationId = ref(null);
  const colorScheme = ref("Awada");
  const view3dError = ref("");
  const expandedLocations = ref({});

  const locations = computed(() => current.value ? current.value.locations : []);
  const navigationPath = computed(() => {
    if (!current.value)
      return [];
    const tree = current.value.locationTree;
    const path = tree.pathTo(currentLocationId.value);
    const flatten = (nodes) => {
      const result = [];
      const visited = new Set();
      const append = (node, depth) => {
        const key = String(node.location.id);
        if (visited.has(key))
          return;
        visited.add(key);
        result.push({ location: node.location, children: node.children, depth });
        if (expandedLocations.value[key])
          node.children.forEach((child) => append(child, depth + 1));
      };
      nodes.forEach((node) => append(node, 0));
      return result;
    };
    return path.map((node) => ({
      node,
      items: flatten(node.parent ? node.parent.children : tree.roots)
    }));
  });

  function setProject(project) {
    current.value = project;
    currentLocationId.value = null;
    expandedLocations.value = {};
    view3dError.value = "";
  }

  function clear() { setProject(null); }
  function toggleLocation(id) {
    const key = String(id);
    expandedLocations.value = {
      ...expandedLocations.value,
      [key]: !expandedLocations.value[key]
    };
  }

  return {
    current, currentLocationId, colorScheme, view3dError, expandedLocations,
    locations, navigationPath, setProject, clear, toggleLocation
  };
}
