// @ts-nocheck
import { Location } from "./Location";
import { LocationTree } from "./LocationTree";
import { EngineryFactory } from "./EngineryFactory";
import { SubgineryFactory } from "./SubgineryFactory";
import { SubgineryLightingState } from "./enginery/Lighting/SubgineryLightingState";

export class Project {
  constructor(data) {
    Object.assign(this, data);
    this.engineries = (data.engineries || [])
      .map((item) => EngineryFactory.create(item, this))
      .filter(Boolean);
    this.subgineries = (data.subgineries || [])
      .map((item) => SubgineryFactory.create(item, this))
      .filter(Boolean);
    this.subgineryStates = [];
    if (this.subgineries.some((item) => item.type === "Lighting"))
      this.subgineryStates.push(new SubgineryLightingState());
    const subgineriesByLocation = new Map();
    for (const subginery of this.subgineries) {
      const key = String(subginery.locationID);
      if (!subgineriesByLocation.has(key))
        subgineriesByLocation.set(key, []);
      subgineriesByLocation.get(key).push(subginery);
    }
    this.locations = (data.locations || []).map((item) =>
      new Location(item, subgineriesByLocation.get(String(item.id)) || [])
    );
    this.locationTree = new LocationTree(this.locations, this.rootLocationID);
  }

  subgineryState(type) {
    return this.subgineryStates.find((state) => state.type === type) || null;
  }
}
