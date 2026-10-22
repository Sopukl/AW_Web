import { booleanUnit, numberUnit } from "../../FUnit";
import { LightEnginery } from "./LightEnginery";

export class DynamicLight extends LightEnginery {
  readonly On = this.register("On", booleanUnit());
  readonly ScenarioIndex = this.register("ScenarioIndex", numberUnit());
}
