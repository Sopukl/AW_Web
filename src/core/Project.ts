// @ts-nocheck
import { Location } from "./Location";
import { LocationTree } from "./LocationTree";

export class Project {
  constructor(data) {
    Object.assign(this, data);
    this.locations = (data.locations || []).map((item) => new Location(item));
    this.locationTree = new LocationTree(this.locations, this.rootLocationID);
  }
}
