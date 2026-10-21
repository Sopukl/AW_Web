// @ts-nocheck
import * as THREE from "three";
import { Model } from "./Model";
import { Surface } from "./Surface";
import { ControlFactory } from "./controls/ControlFactory";
export { COLOR_SCHEMES } from "./colorSchemes";

  function decodeBase64(value) {
    const binary = atob(String(value || "").replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++)
      bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function decodeVertices(value) {
    const bytes = decodeBase64(value);
    if (bytes.byteLength < 4)
      return [];
    const view = new DataView(bytes.buffer, bytes.byteOffset + 4, bytes.byteLength - 4);
    const count = Math.floor(view.byteLength / (6 * 8));
    const result = new Array(count);
    for (let i = 0; i < count; i++) {
      const offset = i * 48;
      result[i] = [
        view.getFloat64(offset, true),
        view.getFloat64(offset + 8, true),
        view.getFloat64(offset + 16, true),
        view.getFloat64(offset + 24, true),
        view.getFloat64(offset + 32, true),
        view.getFloat64(offset + 40, true)
      ];
    }
    return result;
  }

  function decodeIndices(value) {
    const bytes = decodeBase64(value);
    if (bytes.byteLength < 4)
      return [];
    const view = new DataView(bytes.buffer, bytes.byteOffset + 4, bytes.byteLength - 4);
    const count = Math.floor(view.byteLength / 2);
    const result = new Array(count);
    for (let i = 0; i < count; i++)
      result[i] = view.getUint16(i * 2, true);
    return result;
  }

  function parseColor(value) {
    if (value && typeof value === "object") {
      const scale = value.isDouble ? 1 : 1 / 255;
      return {
        color: new THREE.Color(
          Number(value.r || 0) * scale,
          Number(value.g || 0) * scale,
          Number(value.b || 0) * scale
        ),
        opacity: value.a === undefined ? 1 : Number(value.a) * scale
      };
    }

    const text = String(value || "#b8c0c8");
    const argb = /^#([0-9a-f]{8})$/i.exec(text);
    if (argb) {
      return {
        color: new THREE.Color("#" + argb[1].slice(2)),
        opacity: parseInt(argb[1].slice(0, 2), 16) / 255
      };
    }
    try {
      return { color: new THREE.Color(text), opacity: 1 };
    } catch (e) {
      return { color: new THREE.Color("#b8c0c8"), opacity: 1 };
    }
  }

export function vector(value, fallback) {
    if (!value || typeof value !== "object")
      return fallback.clone();
    return new THREE.Vector3(
      Number(value.x) || 0,
      Number(value.y) || 0,
      Number(value.z) || 0
    );
  }

function isRenderSurface(surface) {
  return surface.Signature === "S" || surface.Signature === 83;
}

function isFlatNavigationSurface(surface) {
  for (const subsurface of surface.subsurfaces || []) {
    const vertices = decodeVertices(subsurface.vertices);
    const indices = decodeIndices(subsurface.indices);
    const fillCount = Math.min(Number(subsurface.fillCount) || 0, indices.length);
    for (let index = 0; index + 2 < fillCount; index += 3) {
      const a = vertices[indices[index]];
      const b = vertices[indices[index + 1]];
      const c = vertices[indices[index + 2]];
      if (!a || !b || !c)
        continue;
      if (Math.abs(a[2] - b[2]) > 1 ||
          Math.abs(a[2] - c[2]) > 1 ||
          Math.abs(b[2] - c[2]) > 1)
        return false;
    }
  }
  return true;
}

function buildSurface(surface, options = {}) {
  const positions = [];
  const normals = [];
  const fillIndices = [];
  const contourIndices = [];

  for (const subsurface of surface.subsurfaces || []) {
    const vertexOffset = positions.length / 3;
    const indices = decodeIndices(subsurface.indices);
    const fillCount = Math.min(Number(subsurface.fillCount) || 0, indices.length);
    for (let index = 0; index < fillCount; index++)
      fillIndices.push(indices[index] + vertexOffset);
    for (let index = fillCount; index < indices.length; index++)
      contourIndices.push(indices[index] + vertexOffset);
    for (const item of decodeVertices(subsurface.vertices)) {
      positions.push(item[0], item[1], item[2]);
      normals.push(item[3], item[4], item[5]);
    }
  }

  const group = new THREE.Group();
  if (!positions.length)
    return group;

  const position = new THREE.Float32BufferAttribute(positions, 3);
  const normal = new THREE.Float32BufferAttribute(normals, 3);
  const parsedColor = options.color
    ? { color: new THREE.Color(options.color), opacity: 1 }
    : parseColor(surface.color);

  let fillGeometry = null;
  if (fillIndices.length) {
    fillGeometry = new THREE.BufferGeometry();
    fillGeometry.setAttribute("position", position);
    fillGeometry.setAttribute("normal", normal);
    fillGeometry.setIndex(fillIndices);
    fillGeometry.computeBoundingSphere();

    const mesh = new Surface(fillGeometry, parsedColor.color, parsedColor.opacity);
    mesh.material.userData.baseOpacity = parsedColor.opacity;
    mesh.material.userData.enginery = !!options.enginery;
    mesh.material.userData.engineryType = options.engineryType || "";
    mesh.material.userData.controlContour = false;
    group.add(mesh);
  }

  if (!options.navigation && (contourIndices.length || (options.enginery && fillGeometry))) {
    const geometry = contourIndices.length
      ? new THREE.BufferGeometry()
      : new THREE.EdgesGeometry(fillGeometry);
    if (contourIndices.length) {
      geometry.setAttribute("position", position.clone());
      geometry.setAttribute("normal", normal.clone());
      geometry.setIndex(contourIndices);
    }
    const contourOpacity = options.enginery ? 1 : parsedColor.opacity;
    const contourColor = options.enginery
      ? parsedColor.color
      : parsedColor.color.clone().multiplyScalar(0.55);
    const material = new THREE.LineBasicMaterial({
      color: contourColor,
      opacity: contourOpacity,
      transparent: contourOpacity < 1
    });
    material.userData.baseOpacity = contourOpacity;
    material.userData.enginery = !!options.enginery;
    material.userData.engineryType = options.engineryType || "";
    material.userData.fixedOpacity = !!options.enginery;
    material.userData.controlContour = !!options.enginery;
    group.add(new THREE.LineSegments(geometry, material));
  }

  return group;
}

export function buildModel(model, engineryById, engineryObjects, navigationObjects, colorScheme) {
    const group = new Model(model.id);
    const modelControls = new Map();
    for (const surface of model.constructionSurfaces || [])
      group.add(buildSurface(surface, { construction: true }));

    for (const surface of model.navigationSurfaces || []) {
      const locationId = surface.LocationId === undefined
        ? surface.locationID : surface.LocationId;
      const object = buildSurface(surface, {
        color: colorScheme.navigation,
        navigation: true
      });
      object.name = "navigation-" + locationId;
      object.visible = false;
      object.userData.locationId = locationId;
      object.userData.modelId = model.id;
      object.userData.flat = isFlatNavigationSurface(surface);
      object.traverse((child) => {
        if (child.material) {
          child.material.userData.navigation = true;
          child.userData.navigationLocationId = locationId;
        }
      });
      group.userData.navigationSurfaces.push(object);
      navigationObjects.push(object);
      group.add(object);
    }

    for (const surface of model.enginerySurfaces || []) {
      const engineryId = surface.DeviceId === undefined
        ? surface.engineryID : surface.DeviceId;
      const enginery = engineryById.get(String(engineryId));
      const color = colorScheme.lighting[enginery && enginery.type];
      if (!enginery || !color || !isRenderSurface(surface))
        continue;

      const surfaceObject = buildSurface(surface, {
        color: color,
        enginery: true,
        engineryType: enginery.type,
        unlit: true
      });
      const key = String(engineryId);
      let control = modelControls.get(key);
      if (!control) {
        control = ControlFactory.create(enginery, model.id, colorScheme);
        if (!control)
          continue;
        control.visible = false;
        modelControls.set(key, control);
        group.add(control);
        if (!engineryObjects.has(key))
          engineryObjects.set(key, []);
        engineryObjects.get(key).push(control);
      }
      control.add(...surfaceObject.children.slice());
    }
    return group;
  }

