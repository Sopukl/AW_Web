// @ts-nocheck
import { EngineryObject } from "../EngineryObject";
import { applyColor, applyOpacity, lightOpacity } from "./materials";

export class LightEnginery extends EngineryObject {
  applyToObjects(objects, scheme, modelOpacity): void {
    applyColor(this, objects, scheme);
    applyOpacity(this, objects, lightOpacity(this), modelOpacity);
  }

  applyScheme(objects, scheme): void {
    applyColor(this, objects, scheme);
  }
}
