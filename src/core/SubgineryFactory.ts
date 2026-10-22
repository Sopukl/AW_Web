import type { SubginerySource } from "./SubgineryObject";
import { SubgineryObject } from "./SubgineryObject";
import { LightingObject } from "./enginery/Lighting/LightingObject";

type Constructor = new (
  item: SubginerySource,
  project: unknown
) => SubgineryObject;

const registry = new Map<string, Constructor>([
  ["Lighting", LightingObject]
]);

export const SubgineryFactory = {
  create(item: SubginerySource, project: unknown): SubgineryObject | null {
    const ObjectClass = registry.get(item.type);
    return ObjectClass ? new ObjectClass(item, project) : null;
  }
};
