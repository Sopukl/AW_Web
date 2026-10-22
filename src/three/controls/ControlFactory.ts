import type { EngineryObject } from "../../core/EngineryObject";
import {
  Control,
  type ControlColorScheme,
  type SurfaceBuilder
} from "../Control";
import { DimmingLightControl } from "./Lighting/DimmingLightControl";
import { DynamicLightControl } from "./Lighting/DynamicLightControl";
import { LightSensorControl } from "./Lighting/LightSensorControl";
import { PresenceSensorControl } from "./Lighting/PresenceSensorControl";
import { RgbLightControl } from "./Lighting/RgbLightControl";
import { RgbwLightControl } from "./Lighting/RgbwLightControl";
import { SwitchingLightControl } from "./Lighting/SwitchingLightControl";
import { TunableWhiteLightControl } from "./Lighting/TunableWhiteLightControl";

type ControlConstructor = new (
  enginery: EngineryObject,
  modelId: string | number,
  scheme: ControlColorScheme,
  modelSurfaces: Record<string, any>[],
  surfaceBuilder: SurfaceBuilder
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
    scheme: ControlColorScheme,
    modelSurfaces: Record<string, any>[],
    surfaceBuilder: SurfaceBuilder
  ): Control | null {
    const Constructor = registry.get(enginery.type);
    return Constructor
      ? new Constructor(enginery, modelId, scheme, modelSurfaces, surfaceBuilder)
      : null;
  }
};
