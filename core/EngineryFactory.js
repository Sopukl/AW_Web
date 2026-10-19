const registry = new Map();

export const EngineryFactory = {
  register(type, ctor) { registry.set(type, ctor); },
  create(item, project) {
    const Ctor = registry.get(item.type);
    return Ctor ? new Ctor(item, project) : null;
  },
  reset() { registry.clear(); }
};
