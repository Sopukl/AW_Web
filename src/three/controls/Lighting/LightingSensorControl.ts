import { LightControl } from "./LightControl";

export class LightingSensorControl extends LightControl {
  protected override isSensorControl(): boolean {
    return true;
  }
}
