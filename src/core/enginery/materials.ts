// @ts-nocheck
export function schemeColor(enginery, scheme, fallback = "#808080") {
  return (scheme.lighting && scheme.lighting[enginery.type]) || fallback;
}

export function applyColor(enginery, objects, scheme, fallback) {
  const color = enginery.presented ? schemeColor(enginery, scheme, fallback) : "#808080";
  for (const object of objects || []) {
    object.traverse((child) => {
      if (child.material && child.material.color)
        child.material.color.set(color);
    });
  }
}

export function applyOpacity(enginery, objects, opacity, modelOpacity) {
  for (const object of objects || []) {
    object.traverse((child) => {
      const material = child.material;
      if (!material)
        return;
      material.userData.notPresented = !enginery.presented;
      if (!enginery.presented) {
        material.opacity = 0.5 * modelOpacity;
        material.transparent = true;
      } else if (material.userData.fixedOpacity) {
        material.opacity = 1;
        material.transparent = false;
      } else {
        material.userData.baseOpacity = opacity;
        material.opacity = opacity * modelOpacity;
        material.transparent = material.opacity < 1;
      }
      material.depthWrite = false;
    });
  }
}

export function lightOpacity(enginery) {
  const on = enginery.units.On?.value;
  if (on === false)
    return 0;
  const level = Number(enginery.units.Level?.value);
  return Number.isFinite(level) ? Math.max(0, Math.min(100, level)) / 100 : 1;
}
