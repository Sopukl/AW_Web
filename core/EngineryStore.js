import { EngineryFactory } from "./EngineryFactory.js";

export class EngineryStore {
  constructor() {
    this.items = new Map();
    this.version = 0;
    this.listeners = new Set();
  }

  build(project) {
    this.items.clear();
    for (const item of project.engineries || []) {
      const enginery = EngineryFactory.create(item, project);
      this.items.set(String(enginery.id), enginery);
    }
    this.changed();
    return this;
  }

  get(id) { return this.items.get(String(id)); }
  all() { return Array.from(this.items.values()); }

  updateState(id, field, value) {
    const enginery = this.get(id);
    if (!enginery)
      return false;
    enginery.updateState(field, value);
    this.changed();
    return true;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  changed() {
    this.version++;
    for (const listener of this.listeners)
      listener(this.version);
  }
}
