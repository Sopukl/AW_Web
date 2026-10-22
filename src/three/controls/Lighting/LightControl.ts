import { Control } from "../../Control";

export class LightControl extends Control {
  override build(): void {
    this.addRenderSurface("S", false);
  }
}
