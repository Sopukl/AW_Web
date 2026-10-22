// @ts-nocheck
import * as THREE from "three";
import type { EngineryObject } from "../core/EngineryObject";
import { Surface } from "./Surface";

export interface ControlColorScheme {
  generic: string;
  lighting: Record<string, string>;
}

export type SurfaceBuilder = (
  surface: Record<string, unknown>,
  options: Record<string, unknown>
) => THREE.Group;

export class Control extends THREE.Group {
  readonly enginery: EngineryObject;
  _dirty = true;
  private scheme: ControlColorScheme;
  private modelOpacity = 0;
  private presented = false;
  private readonly modelSurfaces: Record<string, any>[];
  private readonly surfaceBuilder: SurfaceBuilder;
  private readonly markDirty = (): void => { this._dirty = true; };

  constructor(
    enginery: EngineryObject,
    modelId: string | number,
    scheme: ControlColorScheme,
    modelSurfaces: Record<string, any>[],
    surfaceBuilder: SurfaceBuilder
  ) {
    super();
    this.enginery = enginery;
    this.scheme = scheme;
    this.modelSurfaces = modelSurfaces;
    this.surfaceBuilder = surfaceBuilder;
    this.name = `enginery-${enginery.id}`;
    this.userData.engineryId = enginery.id;
    this.userData.modelId = modelId;
    this.userData.presented = false;
    enginery.addEventListener("changed", this.markDirty);
  }

  addRenderSurface(signature: string | number): boolean {
    const surface = this.modelSurfaces.find((candidate) => {
      const engineryId = candidate.DeviceId === undefined
        ? candidate.engineryID
        : candidate.DeviceId;
      const sameSignature = candidate.Signature === signature ||
        (typeof signature === "string" &&
          candidate.Signature === signature.charCodeAt(0));
      return String(engineryId) === String(this.enginery.id) && sameSignature;
    });
    if (!surface)
      return false;

    const object = this.surfaceBuilder(surface, {
      color: this.scheme.lighting[this.enginery.type] || this.scheme.generic,
      enginery: true,
      engineryType: this.enginery.type
    });
    this.add(...object.children.slice());
    this._dirty = true;
    return true;
  }

  build(): void {}

  setPresented(value: boolean): void {
    if (this.presented === value)
      return;
    this.presented = value;
    this.userData.presented = value;
    this.visible = value;
    this.traverse((child) => { child.visible = value; });
    this._dirty = true;
  }

  setScheme(scheme: ControlColorScheme): void {
    this.scheme = scheme;
    this._dirty = true;
  }

  setModelOpacity(opacity: number): void {
    if (this.modelOpacity === opacity)
      return;
    this.modelOpacity = opacity;
    this._dirty = true;
  }

  paint(): void {
    if (!this._dirty)
      return;
    this._dirty = false;
    const color = this.scheme.lighting[this.enginery.type] || this.scheme.generic;
    const on = this.enginery.units.On?.value;
    const rawLevel = this.enginery.units.Level?.value;
    const level = Number(rawLevel);
    const opacity = (on === false)
      ? 0
      : (Number.isFinite(level) ? Math.max(0, Math.min(100, level)) / 100 : 1);

    this.traverse((child) => {
      const material = child.material;
      if (!material)
        return;
      if (child instanceof Surface)
        child.color = color;
      else if (material.color)
        material.color.set(color);
      material.userData.notPresented = !this.presented;
      if (material.userData.fixedOpacity) {
        material.opacity = 1;
        material.transparent = false;
      } else {
        material.userData.baseOpacity = opacity;
        if (child instanceof Surface)
          child.opacity = opacity * this.modelOpacity;
        else
          material.opacity = opacity * this.modelOpacity;
        material.transparent = material.opacity < 1;
      }
    });
  }

  dispose(): void {
    this.enginery.removeEventListener("changed", this.markDirty);
  }
}
