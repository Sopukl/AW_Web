import { Control } from "../../Control";
import {
  Page,
  SubgineryLightingState
} from "../../../core/enginery/Lighting/SubgineryLightingState";
import { State, type SubgineryState } from "../../../core/SubgineryState";

export class LightControl extends Control {
  private readonly handlePageChanged = (): void => {
    this.refreshVisibility();
    this._dirty = true;
  };

  override build(): void {
    this.addRenderSurface("S", false);
  }

  override activate(
    subgineryState: SubgineryState | null,
    projectStates: SubgineryState[]
  ): void {
    super.activate(subgineryState, projectStates);
    if (subgineryState instanceof SubgineryLightingState)
      subgineryState.addEventListener("pageChanged", this.handlePageChanged);
  }

  override deactivate(): void {
    if (this.activeSubgineryState instanceof SubgineryLightingState) {
      this.activeSubgineryState.removeEventListener(
        "pageChanged",
        this.handlePageChanged
      );
    }
    super.deactivate();
  }

  protected isSensorControl(): boolean {
    return false;
  }

  protected override isVisibleForSubgineryState(): boolean {
    if (!super.isVisibleForSubgineryState())
      return false;
    const lightingState = this.activeSubgineryState;
    const state = lightingState?.state ?? State.Normal;
    if (state === State.Normal)
      return !this.isSensorControl();
    if (
      state !== State.Monopoly ||
      !(lightingState instanceof SubgineryLightingState)
    ) {
      return false;
    }
    if (lightingState.page === Page.Light)
      return !this.isSensorControl();
    if (lightingState.page === Page.Sensors)
      return this.isSensorControl();
    return false;
  }
}
