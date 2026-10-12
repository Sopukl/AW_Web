(function (root) {
  "use strict";

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

  function vector(value, fallback) {
    if (!value || typeof value !== "object")
      return fallback.clone();
    return new THREE.Vector3(
      Number(value.x) || 0,
      Number(value.y) || 0,
      Number(value.z) || 0
    );
  }

  const COLOR_SCHEMES = {
    Default: {
      background: "#212121",
      navigation: "#000000",
      lighting: {
        DimmingLight: "#ff9900",
        DynamicLight: "#ffff33",
        EmergencyUnit: "#04ff1c",
        RGBLight: "#ff9900",
        RGBWLight: "#ff9900",
        RgbLight: "#ff9900",
        RgbwLight: "#ff9900",
        SwitchingLight: "#ffd800",
        TunableWhiteLight: "#f9deb9"
      }
    },
    Awada: {
      background: "#9b9b9b",
      navigation: "#ffffff",
      lighting: {
        DimmingLight: "#e42583",
        DynamicLight: "#ffff33",
        EmergencyUnit: "#04ff1c",
        RGBLight: "#e42583",
        RGBWLight: "#e42583",
        RgbLight: "#e42583",
        RgbwLight: "#e42583",
        SwitchingLight: "#a821b6",
        TunableWhiteLight: "#f9deb9"
      }
    }
  };
  const OPAQUE_CONSTRUCTION_LAYER = 1;
  const NAVIGATION_LAYER = 2;
  const CONTROL_LAYER = 3;
  const TRANSPARENT_DEPTH_LAYER = 4;
  const TRANSPARENT_COLOR_LAYER = 5;
  const OPAQUE_CONSTRUCTION_ORDER = 100;
  const NAVIGATION_ORDER = 200;
  const CONTROL_ORDER = 300;
  const TRANSPARENT_DEPTH_ORDER = 400;
  const TRANSPARENT_COLOR_ORDER = 500;
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

      const Material = options.unlit ? THREE.MeshBasicMaterial : THREE.MeshLambertMaterial;
      const material = new Material({
        color: parsedColor.color,
        opacity: parsedColor.opacity,
        transparent: parsedColor.opacity < 1,
        side: THREE.DoubleSide,
        depthWrite: parsedColor.opacity >= 1,
        polygonOffset: !!options.enginery,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
      });
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
        geometry.setIndex(contourIndices);
      } else {
        geometry = new THREE.EdgesGeometry(fillGeometry);
      }
      const contourOpacity = options.enginery ? 1 : parsedColor.opacity;
      const material = new THREE.LineBasicMaterial({
        color: options.enginery
          ? parsedColor.color
          : parsedColor.color.clone().multiplyScalar(0.55),
        transparent: contourOpacity < 1,
        opacity: contourOpacity
      });
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

  function buildModel(model, engineryById, engineryObjects, navigationObjects, colorScheme) {
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

  class ProjectThreeView {
    constructor(container, project, colorSchemeName) {
      if (!root.THREE)
        throw new Error("Не удалось загрузить Three.js");
      if (!container)
        throw new Error("Не найден контейнер 3D-view");

      this.container = container;
      this.project = project;
      this.locations = new Map((project.locations || []).map((item) => [String(item.id), item]));
      this.models = new Map();
      this.engineryObjects = new Map();
      this.engineryStates = new Map();
      this.navigationObjects = [];
      this.engineryById = new Map((project.engineries || []).map((item) => [String(item.id), item]));
      this.colorSchemeName = COLOR_SCHEMES[colorSchemeName] ? colorSchemeName : "Awada";
      this.currentCenter = new THREE.Vector3();
      this.disposed = false;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(COLOR_SCHEMES[this.colorSchemeName].background);

      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000000);
      this.camera.up.set(0, 0, 1);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.replaceChildren(this.renderer.domElement);
      this.raycaster = new THREE.Raycaster();
      this.raycaster.layers.set(NAVIGATION_LAYER);
      this.pointer = new THREE.Vector2();
      this.handleNavigationClick = this.handleNavigationClick.bind(this);
      this.handleControlHover = this.handleControlHover.bind(this);
      this.clearControlHover = this.clearControlHover.bind(this);
      this.renderer.domElement.addEventListener("click", this.handleNavigationClick);
      this.renderer.domElement.addEventListener("pointermove", this.handleControlHover);
      this.renderer.domElement.addEventListener("pointerleave", this.clearControlHover);

      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x66717a, 1.25));
      const light = new THREE.DirectionalLight(0xffffff, 1.75);
      light.position.set(-0.5, -0.7, 1);
      this.scene.add(light);

      for (const model of project.models || []) {
        const object = buildModel(
          model,
          this.engineryById,
          this.engineryObjects,
          this.navigationObjects,
          COLOR_SCHEMES[this.colorSchemeName]
        );
        object.visible = false;
        this.models.set(String(model.id), object);
        this.scene.add(object);
      }

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(container);
      this.resize();
      this.renderFrame = this.renderFrame.bind(this);
      this.animationFrame = requestAnimationFrame(this.renderFrame);
    }

    resize() {
      const width = Math.max(this.container.clientWidth, 1);
      const height = Math.max(this.container.clientHeight, 1);
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    handleNavigationClick(event) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      this.raycaster.layers.set(NAVIGATION_LAYER);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersections = this.raycaster.intersectObjects(this.navigationObjects, true);
      const hit = intersections.find((item) => {
        let object = item.object;
        while (object) {
          if (!object.visible)
            return false;
          object = object.parent;
        }
        return item.object.userData.navigationLocationId !== undefined &&
          item.object.userData.navigationEnabled;
      });
      if (hit && typeof this.onNavigate === "function")
        this.onNavigate(hit.object.userData.navigationLocationId);
    }

    setHoveredControl(object) {
      if (this.hoveredControl === object)
        return;
      const updateContour = (control, hovered) => {
        if (!control)
          return;
        control.traverse((child) => {
          const material = child.material;
          if (!material || !material.userData.controlContour)
            return;
          if (hovered) {
            material.color.set(0x0000ff);
          } else if (material.userData.notPresented) {
            material.color.set(0x808080);
          } else {
            const scheme = COLOR_SCHEMES[this.colorSchemeName];
            const color = scheme.lighting[material.userData.engineryType];
            if (color)
              material.color.set(color);
          }
        });
      };
      updateContour(this.hoveredControl, false);
      this.hoveredControl = object || null;
      updateContour(this.hoveredControl, true);
      this.renderer.domElement.style.cursor = this.hoveredControl ? "pointer" : "";
    }

    handleControlHover(event) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      this.raycaster.layers.set(CONTROL_LAYER);
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const controls = [];
      for (const objects of this.engineryObjects.values())
        controls.push(...objects);
      const intersections = this.raycaster.intersectObjects(controls, true);
      const hit = intersections.find((item) => {
        let object = item.object;
        while (object) {
          if (!object.visible)
            return false;
          object = object.parent;
        }
        return true;
      });
      let control = hit ? hit.object : null;
      while (control && control.userData.engineryId === undefined)
        control = control.parent;
      this.setHoveredControl(control);
    }

    clearControlHover() {
      this.setHoveredControl(null);
    }

    setColorScheme(name) {
      const scheme = COLOR_SCHEMES[name];
      if (!scheme)
        return false;
      this.colorSchemeName = name;
      this.scene.background.set(scheme.background);
      this.scene.traverse((object) => {
        const material = object.material;
        if (!material)
          return;
        if (material.userData.navigation) {
          material.color.set(scheme.navigation);
          return;
        }
        if (!material.userData.enginery)
          return;
        if (material.userData.notPresented) {
          material.color.set(0x808080);
          return;
        }
        const color = scheme.lighting[material.userData.engineryType];
        if (color)
          material.color.set(color);
      });
      if (this.hoveredControl) {
        const hovered = this.hoveredControl;
        this.hoveredControl = null;
        this.setHoveredControl(hovered);
      }
      return true;
    }

    arrangementFor(locationId) {
      const location = this.locations.get(String(locationId));
      return location && location.arrangements && location.arrangements[0];
    }

    stateFor(arrangement) {
      const modelState = new Map();
      for (const item of (arrangement && arrangement.models) || []) {
        modelState.set(String(item.id), {
          position: vector(item.position, new THREE.Vector3()),
          opacity: item.visibility ? 1 : 0
        });
      }
      return {
        position: vector(arrangement && arrangement.position, new THREE.Vector3(10, -10, 10)),
        center: vector(arrangement && arrangement.center, new THREE.Vector3()),
        models: modelState
      };
    }

    captureState() {
      const modelState = new Map();
      for (const [id, object] of this.models) {
        modelState.set(id, {
          position: object.position.clone(),
          opacity: object.userData.opacity || 0
        });
      }
      return {
        position: this.camera.position.clone(),
        center: this.currentCenter.clone(),
        models: modelState
      };
    }

    setLocationNavigations(locationId) {
      const location = this.locations.get(String(locationId));
      const locationModels = new Map(
        ((location && location.models) || []).map((model) => [String(model.id), model])
      );

      for (const [modelId, model] of this.models) {
        const surfaces = model.userData.navigationSurfaces || [];
        const locationModel = locationModels.get(modelId);
        const transitions = (locationModel && locationModel.transitions) || [];
        const transitionTargets = new Set(
          transitions.map((transition) => String(transition.locationID))
        );
        for (const surface of surfaces) {
          const enabled = transitionTargets.has(String(surface.userData.locationId));
          surface.userData.navigationEnabled = enabled;
          surface.traverse((child) => {
            if (child.userData.navigationLocationId !== undefined)
              child.userData.navigationEnabled = enabled;
          });
        }
        const current = surfaces.find((surface) =>
          String(surface.userData.locationId) === String(locationId)
        );
        if (current) {
          surfaces.forEach((surface) => { surface.visible = false; });
          current.visible = current.userData.flat;
          continue;
        }

        const neighbours = new Set();
        for (const transition of transitions) {
          if (transition.sameLevel)
            neighbours.add(String(transition.locationID));
        }
        for (const surface of surfaces) {
          surface.visible = surface.userData.flat &&
            !neighbours.has(String(surface.userData.locationId));
        }
      }
    }

    setLocationEngineries(locationId) {
      this.clearControlHover();
      const location = this.locations.get(String(locationId));
      const presented = new Set();
      for (const model of (location && location.models) || []) {
        for (const control of model.controls || [])
          presented.add(String(control.engineryID));
      }

      for (const [id, objects] of this.engineryObjects) {
        const isPresented = presented.has(id);
        for (const object of objects) {
          object.userData.presented = isPresented;
          object.visible = true;
          object.traverse((child) => {
            if (!child.material)
              return;
            child.layers.set(CONTROL_LAYER);
            child.renderOrder = CONTROL_ORDER;
            child.material.userData.notPresented = !isPresented;
            if (!isPresented) {
              child.material.color.set(0x808080);
              child.material.opacity = 0.5;
              child.material.transparent = true;
              child.material.depthWrite = false;
              return;
            }
            const scheme = COLOR_SCHEMES[this.colorSchemeName];
            const color = scheme.lighting[child.material.userData.engineryType];
            if (color)
              child.material.color.set(color);
          });
        }
      }
    }

    updateEngineryState(engineryId, field, value) {
      const key = String(engineryId);
      if (!this.engineryObjects.has(key))
        return;

      while (value !== null && typeof value === "object" &&
             Object.prototype.hasOwnProperty.call(value, "value"))
        value = value.value;

      const state = this.engineryStates.get(key) || { on: null, brightness: null };
      if (field === "On")
        state.on = value === true || value === 1 || value === "1" || value === "true";
      else if (field === "BrightnessLevel" || field === "GroupLevel") {
        const level = Number(value);
        if (Number.isFinite(level))
          state.brightness = THREE.MathUtils.clamp(level, 0, 100);
      } else {
        return;
      }
      this.engineryStates.set(key, state);

      const opacity = state.on === false
        ? 0
        : (state.brightness === null ? 1 : state.brightness / 100);
      for (const object of this.engineryObjects.get(key)) {
        const model = this.models.get(String(object.userData.modelId));
        const modelOpacity = model ? (model.userData.opacity || 0) : 0;
        object.traverse((child) => {
          if (!child.material)
            return;
          if (child.material.userData.notPresented) {
            child.material.opacity = 0.5 * modelOpacity;
            child.material.transparent = true;
            child.material.depthWrite = false;
            return;
          }
          if (child.material.userData.fixedOpacity) {
            child.material.opacity = 1;
            child.material.transparent = false;
            child.material.depthWrite = false;
            return;
          }
          child.material.userData.baseOpacity = opacity;
          child.material.opacity = opacity * modelOpacity;
          child.material.transparent = child.material.opacity < 1;
          child.material.depthWrite = false;
        });
      }
    }

    applyState(state) {
      this.camera.position.copy(state.position);
      this.currentCenter.copy(state.center);
      if (this.camera.position.distanceToSquared(this.currentCenter) < 0.000001)
        this.camera.position.add(new THREE.Vector3(10, -10, 10));
      this.camera.lookAt(this.currentCenter);

      for (const [id, object] of this.models) {
        const info = state.models.get(id) || {
          position: new THREE.Vector3(),
          opacity: 0
        };
        object.position.copy(info.position);
        object.userData.opacity = info.opacity;
        object.visible = info.opacity > 0.001;
        object.traverse((child) => {
          if (!child.material)
            return;
          const renderPass = child.material.userData.renderPass;
          if (renderPass === "transparentDepth") {
            child.material.opacity = 1;
            child.material.transparent = false;
            child.material.colorWrite = false;
            child.material.depthWrite = true;
            return;
          }
          if (child.material.userData.notPresented) {
            child.material.opacity = 0.5 * info.opacity;
            child.material.transparent = true;
            child.material.depthWrite = false;
            return;
          }
          if (child.material.userData.fixedOpacity) {
            child.material.opacity = 1;
            child.material.transparent = false;
            child.material.depthWrite = false;
            return;
          }
          const baseOpacity = child.material.userData.baseOpacity === undefined
            ? 1 : child.material.userData.baseOpacity;
          child.material.opacity = baseOpacity * info.opacity;
          child.material.transparent = child.material.opacity < 1;
          if (renderPass === "opaqueConstruction")
            child.material.depthWrite = true;
          else
            child.material.depthWrite = false;
        });
      }
    }

    goToLocation(locationId, animate) {
      const arrangement = this.arrangementFor(locationId);
      if (!arrangement)
        return false;
      this.setLocationNavigations(locationId);
      this.setLocationEngineries(locationId);
      const target = this.stateFor(arrangement);
      if (animate === false) {
        this.transition = null;
        this.applyState(target);
      } else {
        this.transition = {
          startedAt: performance.now(),
          duration: 500,
          from: this.captureState(),
          to: target
        };
      }
      return true;
    }

    interpolateState(from, to, amount) {
      const modelState = new Map();
      for (const id of this.models.keys()) {
        const a = from.models.get(id) || { position: new THREE.Vector3(), opacity: 0 };
        const b = to.models.get(id) || { position: new THREE.Vector3(), opacity: 0 };
        modelState.set(id, {
          position: a.position.clone().lerp(b.position, amount),
          opacity: THREE.MathUtils.lerp(a.opacity, b.opacity, amount)
        });
      }
      return {
        position: from.position.clone().lerp(to.position, amount),
        center: from.center.clone().lerp(to.center, amount),
        models: modelState
      };
    }

    setCameraLayers(layers, includeDefault) {
      this.camera.layers.set(layers[0]);
      for (let index = 1; index < layers.length; index++)
        this.camera.layers.enable(layers[index]);
      if (includeDefault)
        this.camera.layers.enable(0);
    }

    renderLayer(layer) {
      this.setCameraLayers([layer], true);
      this.renderer.render(this.scene, this.camera);
    }

    renderScene() {
      const renderer = this.renderer;
      const models = Array.from(this.models.values());
      const visibility = models.map((model) => model.visible);
      const previousTarget = renderer.getRenderTarget();
      const previousAutoClear = renderer.autoClear;
      const previousClearColor = renderer.getClearColor(new THREE.Color());
      const previousClearAlpha = renderer.getClearAlpha();
      const previousBackground = this.scene.background;
      const previousLayers = this.camera.layers.mask;

      renderer.autoClear = false;
      this.scene.background = null;
      renderer.setRenderTarget(null);
      renderer.setClearColor(previousBackground || previousClearColor, 1);
      renderer.clear(true, true, true);

      models.forEach((model) => { model.visible = false; });
      for (let index = 0; index < models.length; index++) {
        if (!visibility[index])
          continue;
        const model = models[index];
        model.visible = true;

        this.renderLayer(OPAQUE_CONSTRUCTION_LAYER);

        this.renderLayer(NAVIGATION_LAYER);
        this.renderLayer(CONTROL_LAYER);

        this.renderLayer(TRANSPARENT_DEPTH_LAYER);
        this.renderLayer(TRANSPARENT_COLOR_LAYER);

        model.visible = false;
      }
      models.forEach((model, index) => { model.visible = visibility[index]; });

      this.scene.background = previousBackground;
      this.camera.layers.mask = previousLayers;
      renderer.setRenderTarget(previousTarget);
      renderer.setClearColor(previousClearColor, previousClearAlpha);
      renderer.autoClear = previousAutoClear;
    }

    renderFrame(now) {
      if (this.disposed)
        return;
      if (this.transition) {
        const raw = Math.min((now - this.transition.startedAt) / this.transition.duration, 1);
        const eased = raw * raw * (3 - 2 * raw);
        this.applyState(this.interpolateState(this.transition.from, this.transition.to, eased));
        if (raw >= 1)
          this.transition = null;
      }
      this.renderScene();
      this.animationFrame = requestAnimationFrame(this.renderFrame);
    }

    dispose() {
      this.disposed = true;
      cancelAnimationFrame(this.animationFrame);
      this.resizeObserver.disconnect();
      this.renderer.domElement.removeEventListener("click", this.handleNavigationClick);
      this.renderer.domElement.removeEventListener("pointermove", this.handleControlHover);
      this.renderer.domElement.removeEventListener("pointerleave", this.clearControlHover);
      this.scene.traverse((object) => {
        if (object.geometry)
          object.geometry.dispose();
        if (object.material)
          object.material.dispose();
      });
      this.renderer.dispose();
      this.container.replaceChildren();
    }
  }

  root.ProjectThreeView = ProjectThreeView;
})(typeof window !== "undefined" ? window : globalThis);
