import { booleanUnit, numberUnit } from "../../FUnit";
import { SubgineryObject } from "../../SubgineryObject";

export class LightingObject extends SubgineryObject {
  readonly on = this.register("On", booleanUnit());
  readonly off = this.register("Off", booleanUnit());
  readonly level = this.register("BrightnessLevel", numberUnit());
  readonly scene1On = this.register("Scene1On", booleanUnit());
  readonly scene2On = this.register("Scene2On", booleanUnit());
  readonly lssOn = this.register("LightSensorsOn", booleanUnit());
  readonly lssOff = this.register("LightSensorsOff", booleanUnit());
  readonly pssOn = this.register("PresenceSensorsOn", booleanUnit());
  readonly pssOff = this.register("PresenceSensorsOff", booleanUnit());
  readonly power = this.register("Power", numberUnit());
}
