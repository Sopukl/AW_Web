// @ts-nocheck
import * as THREE from "three";
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

export const OPAQUE_CONSTRUCTION_LAYER = 1;
export const NAVIGATION_LAYER = 2;
export const CONTROL_LAYER = 3;
export const TRANSPARENT_DEPTH_LAYER = 4;
export const TRANSPARENT_COLOR_LAYER = 5;
  const OPAQUE_CONSTRUCTION_ORDER = 100;
  const NAVIGATION_ORDER = 200;
export const CONTROL_ORDER = 300;
  const TRANSPARENT_DEPTH_ORDER = 400;
  const TRANSPARENT_COLOR_ORDER = 500;
  const MNEMO_LIGHTING = {
    ambient: [77 / 255, 77 / 255, 77 / 255, 77 / 255],
    diffuse: [1, 1, 1, 1],
    direction: new THREE.Vector3(-0.5, -0.7, 1).normalize()
  };
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

  function createMnemoLitMaterial(color, opacity) {
    const uniforms = {
      ambientColor: { value: new THREE.Vector4(...MNEMO_LIGHTING.ambient) },
      diffuseColor: { value: new THREE.Vector4(...MNEMO_LIGHTING.diffuse) },
      lightDirection: { value: MNEMO_LIGHTING.direction.clone() },
      surfaceColor: { value: color.clone() },
      surfaceOpacity: { value: opacity }
    };
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: [
        "uniform vec4 ambientColor;",
        "uniform vec4 diffuseColor;",
        "uniform vec3 lightDirection;",
        "uniform vec3 surfaceColor;",
        "uniform float surfaceOpacity;",
        "varying vec4 vertexColor;",
        "void main() {",
        "  vec4 n4 = normalize(modelMatrix * vec4(normal, 0.0));",
        "  vec3 transformedNormal = n4.xyz;",
        "  float NdotL = max(abs(dot(transformedNormal, lightDirection)), 0.2);",
        "  vertexColor = vec4(NdotL * diffuseColor.xyz * surfaceColor.xyz, surfaceOpacity);",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
      ].join("\n"),
      fragmentShader: [
        "varying vec4 vertexColor;",
        "void main() {",
        "  gl_FragColor = vertexColor;",
        "  #include <colorspace_fragment>",
        "}"
      ].join("\n"),
      side: THREE.DoubleSide,
      transparent: opacity < 1,
      depthWrite: opacity >= 1,
      toneMapped: false
    });
    material.color = color.clone();
    material.opacity = opacity;
    material.onBeforeRender = function () {
      uniforms.surfaceColor.value.copy(material.color);
      uniforms.surfaceOpacity.value = material.opacity;
    };
    return material;
  }

  function buildSurface(surface, options) {
    options = options || {};
    const positions = [];
    const normals = [];
    const fillIndices = [];
    const contourIndices = [];

    for (const subsurface of surface.subsurfaces || []) {
      const vertexOffset = positions.length / 3;
      const indices = decodeIndices(subsurface.indices);
      const fillCount = Math.min(Number(subsurface.fillCount) || 0, indices.length);

      for (let i = 0; i < fillCount; i++)
        fillIndices.push(indices[i] + vertexOffset);
      for (let i = fillCount; i < indices.length; i++)
        contourIndices.push(indices[i] + vertexOffset);

      for (const item of decodeVertices(subsurface.vertices)) {
        positions.push(item[0], item[1], item[2]);
        normals.push(item[3], item[4], item[5]);
      }
    }

    const group = new THREE.Group();
    if (!positions.length)
      return group;

    const attributes = {
      position: new THREE.Float32BufferAttribute(positions, 3),
      normal: new THREE.Float32BufferAttribute(normals, 3)
    };
    const parsedColor = options.color
      ? { color: new THREE.Color(options.color), opacity: 1 }
      : parseColor(surface.color);

    let fillGeometry = null;
    if (fillIndices.length) {
      fillGeometry = new THREE.BufferGeometry();
      fillGeometry.setAttribute("position", attributes.position);
      fillGeometry.setAttribute("normal", attributes.normal);
      fillGeometry.setIndex(fillIndices);
      fillGeometry.computeBoundingSphere();

      const material = options.unlit
        ? new THREE.MeshBasicMaterial({
          color: parsedColor.color,
          opacity: parsedColor.opacity,
          transparent: parsedColor.opacity < 1,
          side: THREE.DoubleSide,
          depthWrite: parsedColor.opacity >= 1
        })
        : createMnemoLitMaterial(parsedColor.color, parsedColor.opacity);
      material.polygonOffset = !!options.enginery;
      material.polygonOffsetFactor = 1;
      material.polygonOffsetUnits = 1;
      material.userData.baseOpacity = parsedColor.opacity;
      material.userData.enginery = !!options.enginery;
      material.userData.engineryType = options.engineryType || "";
      material.userData.controlContour = false;
      const mesh = new THREE.Mesh(fillGeometry, material);
      if (options.enginery) {
        material.depthWrite = false;
        material.userData.renderPass = "control";
        mesh.layers.set(CONTROL_LAYER);
        mesh.renderOrder = CONTROL_ORDER;
      } else if (options.navigation) {
        material.depthWrite = false;
        material.transparent = true;
        material.userData.renderPass = "navigation";
        mesh.layers.set(NAVIGATION_LAYER);
        mesh.renderOrder = NAVIGATION_ORDER;
      } else if (options.construction && parsedColor.opacity < 1) {
        material.depthWrite = false;
        material.userData.renderPass = "transparentColor";
        mesh.layers.set(TRANSPARENT_COLOR_LAYER);
        mesh.renderOrder = TRANSPARENT_COLOR_ORDER;

        const depthMaterial = new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: true,
          depthTest: true,
          side: THREE.DoubleSide
        });
        depthMaterial.userData.renderPass = "transparentDepth";
        const depthMesh = new THREE.Mesh(fillGeometry, depthMaterial);
        depthMesh.layers.set(TRANSPARENT_DEPTH_LAYER);
        depthMesh.renderOrder = TRANSPARENT_DEPTH_ORDER;
        group.add(depthMesh);
      } else {
        material.depthWrite = true;
        material.userData.renderPass = "opaqueConstruction";
        mesh.layers.set(OPAQUE_CONSTRUCTION_LAYER);
        mesh.renderOrder = OPAQUE_CONSTRUCTION_ORDER;
      }
      group.add(mesh);
    }

    if (!options.navigation && (contourIndices.length || (options.enginery && fillGeometry))) {
      let geometry;
      if (contourIndices.length) {
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", attributes.position.clone());
        geometry.setAttribute("normal", attributes.normal.clone());
        geometry.setIndex(contourIndices);
      } else {
        geometry = new THREE.EdgesGeometry(fillGeometry);
      }
      const contourOpacity = options.enginery ? 1 : parsedColor.opacity;
      const contourColor = options.enginery
        ? parsedColor.color
        : parsedColor.color.clone().multiplyScalar(0.55);
      const material = options.enginery
        ? new THREE.LineBasicMaterial({
          color: contourColor,
          transparent: contourOpacity < 1,
          opacity: contourOpacity
        })
        : createMnemoLitMaterial(contourColor, contourOpacity);
      material.userData.baseOpacity = contourOpacity;
      material.userData.enginery = !!options.enginery;
      material.userData.engineryType = options.engineryType || "";
      material.userData.fixedOpacity = !!options.enginery;
      material.userData.controlContour = !!options.enginery;
      const lines = new THREE.LineSegments(geometry, material);
      if (options.enginery) {
        material.depthWrite = false;
        material.userData.renderPass = "control";
        lines.layers.set(CONTROL_LAYER);
        lines.renderOrder = CONTROL_ORDER;
      } else if (options.construction && parsedColor.opacity < 1) {
        material.depthWrite = false;
        material.userData.renderPass = "transparentColor";
        lines.layers.set(TRANSPARENT_COLOR_LAYER);
        lines.renderOrder = TRANSPARENT_COLOR_ORDER;
      } else {
        material.depthWrite = true;
        material.userData.renderPass = "opaqueConstruction";
        lines.layers.set(OPAQUE_CONSTRUCTION_LAYER);
        lines.renderOrder = OPAQUE_CONSTRUCTION_ORDER;
      }
      group.add(lines);
    }

    return group;
  }

export function buildModel(model, engineryById, engineryObjects, navigationObjects, colorScheme) {
    const group = new THREE.Group();
    group.name = "model-" + model.id;
    group.userData.modelId = model.id;
    group.userData.navigationSurfaces = [];
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

      const object = buildSurface(surface, {
        color: color,
        enginery: true,
        engineryType: enginery.type,
        unlit: true
      });
      object.name = "enginery-" + engineryId;
      object.visible = false;
      object.userData.engineryId = engineryId;
      object.userData.modelId = model.id;
      object.userData.presented = false;
      group.add(object);

      const key = String(engineryId);
      if (!engineryObjects.has(key))
        engineryObjects.set(key, []);
      engineryObjects.get(key).push(object);
    }
    return group;
  }

