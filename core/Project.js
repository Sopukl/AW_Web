import { Location } from "./Location.js";
import { LocationTree } from "./LocationTree.js";

export class Project {
  constructor(data) {
    Object.assign(this, data);
    this.locations = (data.locations || []).map((item) => new Location(item));
    this.locationTree = new LocationTree(this.locations, this.rootLocationID);
  }
}
