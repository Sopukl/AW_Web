import * as THREE from "three";

export class Surface extends THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> {
  constructor(
    geometry: THREE.BufferGeometry,
    color: THREE.ColorRepresentation,
    opacity = 1
  ) {
    const material = new THREE.MeshBasicMaterial({
      color,
      opacity,
      transparent: opacity < 1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    super(geometry, material);
  }

  get color(): THREE.Color {
    return this.material.color;
  }

  set color(value: THREE.ColorRepresentation) {
    this.material.color.set(value);
  }

  get opacity(): number {
    return this.material.opacity;
  }

  set opacity(value: number) {
    this.material.opacity = value;
  }
}
