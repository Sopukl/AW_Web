import { booleanUnit, numberUnit } from "../../FUnit";
import { LightEnginery } from "./LightEnginery";

export class PresenceSensor extends LightEnginery {
  readonly On = this.register("On", booleanUnit());
  readonly CurrentPresence = this.register("CurrentPresence", booleanUnit());
  readonly HoldTime = this.register("HoldTime", numberUnit());
}
