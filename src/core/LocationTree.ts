// @ts-nocheck
export class LocationTree {
  constructor(locations, rootLocationID) {
    this.nodes = new Map(locations.map((location) => [
      String(location.id), { location, children: [], parent: null }
    ]));
    for (const location of locations) {
      const parent = this.nodes.get(String(location.id));
      for (const model of location.models || []) {
        for (const transition of model.transitions || []) {
          if (transition.sameLevel)
            continue;
          const child = this.nodes.get(String(transition.locationID));
          if (!child || child === parent || child.parent)
            continue;
          child.parent = parent;
          parent.children.push(child);
        }
      }
    }
    const sort = (a, b) => a.location.titleText.localeCompare(b.location.titleText, "ru");
    this.nodes.forEach((node) => node.children.sort(sort));
    this.roots = Array.from(this.nodes.values()).filter((node) => !node.parent).sort(sort);
    const rootIndex = this.roots.findIndex((node) => node.location.id === rootLocationID);
    if (rootIndex > 0)
      this.roots.unshift(this.roots.splice(rootIndex, 1)[0]);
  }

  pathTo(id) {
    const node = this.nodes.get(String(id));
    if (!node)
      return [];
    const path = [];
    for (let current = node; current; current = current.parent)
      path.unshift(current);
    return path;
  }
}
