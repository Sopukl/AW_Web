// @ts-nocheck
import { booleanUnit, numberUnit } from "../FUnit";
import { LightEnginery } from "./LightEnginery";

export class SwitchingLight extends LightEnginery {
  readonly On = this.register("On", booleanUnit());
  readonly Power = this.register("Power", numberUnit());
}
