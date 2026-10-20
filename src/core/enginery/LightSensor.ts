import { booleanUnit, numberUnit } from "../FUnit";
import { LightEnginery } from "./LightEnginery";

export class LightSensor extends LightEnginery {
  readonly On = this.register("On", booleanUnit());
  readonly CurrentLuminosity = this.register("CurrentLuminosity", numberUnit());
}
