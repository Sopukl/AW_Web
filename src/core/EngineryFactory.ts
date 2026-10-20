// @ts-nocheck
import { EngineryObject } from "./EngineryObject";
const registry = new Map();

export const EngineryFactory = {
  register(type, ctor) { registry.set(type, ctor); },
  create(item, project) {
    if (item instanceof EngineryObject)
      return item;
    const Ctor = registry.get(item.type);
    return Ctor ? new Ctor(item, project) : null;
  },
  reset() { registry.clear(); }
};
