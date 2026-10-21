import * as THREE from "three";

export class Model extends THREE.Group {
  readonly modelId: string;

  constructor(modelId: string | number) {
    super();
    this.modelId = String(modelId);
    this.name = `model-${modelId}`;
    this.userData.modelId = modelId;
    this.userData.navigationSurfaces = [];
    this.userData.opacity = 0;
  }
}
