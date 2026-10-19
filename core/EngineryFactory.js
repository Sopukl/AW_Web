import { GenericEnginery } from "./enginery/GenericEnginery.js";

const registry = new Map();

export const EngineryFactory = {
  register(type, ctor) { registry.set(type, ctor); },
  create(item, project) {
    const Ctor = registry.get(item.type) || GenericEnginery;
    return new Ctor(item, project);
  },
  reset() { registry.clear(); }
};
