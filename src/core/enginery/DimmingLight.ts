// @ts-nocheck
import { SwitchingLight } from "./SwitchingLight";
import { numberUnit } from "../FUnit";

export class DimmingLight extends SwitchingLight {
  readonly Level = this.register("Level", numberUnit());
}
