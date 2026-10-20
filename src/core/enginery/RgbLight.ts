// @ts-nocheck
import { SwitchingLight } from "./SwitchingLight";
import { numberUnit, stringUnit } from "../FUnit";

export class RgbLight extends SwitchingLight {
  readonly Color = this.register("Color", stringUnit());
  readonly Level = this.register("Level", numberUnit());
}
