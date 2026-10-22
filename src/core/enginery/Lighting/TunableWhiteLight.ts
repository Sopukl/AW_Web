import { booleanUnit, numberUnit } from "../../FUnit";
import { LightEnginery } from "./LightEnginery";

export class TunableWhiteLight extends LightEnginery {
  readonly On = this.register("On", booleanUnit());
  readonly Level = this.register("Level", numberUnit());
  readonly Temperature = this.register("Temperature", numberUnit());
  readonly Power = this.register("Power", numberUnit());
}
