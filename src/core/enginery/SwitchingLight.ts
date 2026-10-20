// @ts-nocheck
import { Enginery } from "../Enginery";
import { applyColor, applyOpacity, lightOpacity } from "./materials";

export class SwitchingLight extends Enginery {
  applyToObjects(objects, scheme, modelOpacity) {
    applyColor(this, objects, scheme);
    applyOpacity(this, objects, lightOpacity(this.state), modelOpacity);
  }

  applyScheme(objects, scheme) {
    applyColor(this, objects, scheme);
  }
}
