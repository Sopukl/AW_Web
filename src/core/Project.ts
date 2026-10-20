// @ts-nocheck
import { Location } from "./Location";
import { LocationTree } from "./LocationTree";
import { EngineryFactory } from "./EngineryFactory";

export class Project {
  constructor(data) {
    Object.assign(this, data);
    this.engineries = (data.engineries || [])
      .map((item) => EngineryFactory.create(item, this))
      .filter(Boolean);
    this.locations = (data.locations || []).map((item) => new Location(item));
    this.locationTree = new LocationTree(this.locations, this.rootLocationID);
  }
}
