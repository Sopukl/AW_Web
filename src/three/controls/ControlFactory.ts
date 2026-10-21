import type { EngineryObject } from "../../core/EngineryObject";
import { Control, type ControlColorScheme } from "../Control";
import { DimmingLightControl } from "./DimmingLightControl";
import { DynamicLightControl } from "./DynamicLightControl";
import { LightSensorControl } from "./LightSensorControl";
import { PresenceSensorControl } from "./PresenceSensorControl";
import { RgbLightControl } from "./RgbLightControl";
import { RgbwLightControl } from "./RgbwLightControl";
import { SwitchingLightControl } from "./SwitchingLightControl";
import { TunableWhiteLightControl } from "./TunableWhiteLightControl";

type ControlConstructor = new (
  enginery: EngineryObject,
  modelId: string | number,
  scheme: ControlColorScheme
) => Control;

const registry = new Map<string, ControlConstructor>([
  ["SwitchingLight", SwitchingLightControl],
  ["DimmingLight", DimmingLightControl],
  ["RgbLight", RgbLightControl],
  ["RgbwLight", RgbwLightControl],
  ["DynamicLight", DynamicLightControl],
  ["LightSensor", LightSensorControl],
  ["PresenceSensor", PresenceSensorControl],
  ["TunableWhiteLight", TunableWhiteLightControl]
]);

export const ControlFactory = {
  create(
    enginery: EngineryObject,
    modelId: string | number,
    scheme: ControlColorScheme
  ): Control | null {
    const Constructor = registry.get(enginery.type);
    return Constructor ? new Constructor(enginery, modelId, scheme) : null;
  }
};
