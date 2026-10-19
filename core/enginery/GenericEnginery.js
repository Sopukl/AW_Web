import { Enginery } from "../Enginery.js";
import { applyColor, applyOpacity } from "./materials.js";

export class GenericEnginery extends Enginery {
  applyToObjects(objects, scheme, modelOpacity) {
    applyColor(this, objects, scheme, "#808080");
    applyOpacity(this, objects, 1, modelOpacity);
  }

  applyScheme(objects, scheme) {
    applyColor(this, objects, scheme, "#808080");
  }
}
