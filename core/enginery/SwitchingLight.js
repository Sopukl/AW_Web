import { Enginery } from "../Enginery.js";
import { applyColor, applyOpacity, lightOpacity } from "./materials.js";

export class SwitchingLight extends Enginery {
  applyToObjects(objects, scheme, modelOpacity) {
    applyColor(this, objects, scheme);
    applyOpacity(this, objects, lightOpacity(this.state), modelOpacity);
  }

  applyScheme(objects, scheme) {
    applyColor(this, objects, scheme);
  }
}
