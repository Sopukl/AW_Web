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

  function buildConstructionSurface(surface) {
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
    const parsedColor = parseColor(surface.color);

    if (fillIndices.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", attributes.position);
      geometry.setAttribute("normal", attributes.normal);
      geometry.setIndex(fillIndices);
      geometry.computeBoundingSphere();

      const material = new THREE.MeshLambertMaterial({
        color: parsedColor.color,
        opacity: parsedColor.opacity,
        transparent: parsedColor.opacity < 1,
        side: THREE.DoubleSide,
        depthWrite: parsedColor.opacity >= 1
      });
      material.userData.baseOpacity = parsedColor.opacity;
      group.add(new THREE.Mesh(geometry, material));
    }

    if (contourIndices.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", attributes.position.clone());
      geometry.setIndex(contourIndices);
      const material = new THREE.LineBasicMaterial({
        color: parsedColor.color.clone().multiplyScalar(0.55),
        transparent: parsedColor.opacity < 1,
        opacity: parsedColor.opacity
      });
      material.userData.baseOpacity = parsedColor.opacity;
      group.add(new THREE.LineSegments(geometry, material));
    }

    return group;
  }

  function buildModel(model) {
    const group = new THREE.Group();
    group.name = "model-" + model.id;
    group.userData.modelId = model.id;
    for (const surface of model.constructionSurfaces || [])
      group.add(buildConstructionSurface(surface));
    return group;
  }

  class ProjectThreeView {
    constructor(container, project) {
      if (!root.THREE)
        throw new Error("Не удалось загрузить Three.js");
      if (!container)
        throw new Error("Не найден контейнер 3D-view");

      this.container = container;
      this.project = project;
      this.locations = new Map((project.locations || []).map((item) => [String(item.id), item]));
      this.models = new Map();
      this.currentCenter = new THREE.Vector3();
      this.disposed = false;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xe9edf0);

      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000000);
      this.camera.up.set(0, 0, 1);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.replaceChildren(this.renderer.domElement);

      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x66717a, 1.25));
      const light = new THREE.DirectionalLight(0xffffff, 1.75);
      light.position.set(-0.5, -0.7, 1);
      this.scene.add(light);

      for (const model of project.models || []) {
        const object = buildModel(model);
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
          const baseOpacity = child.material.userData.baseOpacity === undefined
            ? 1 : child.material.userData.baseOpacity;
          child.material.opacity = baseOpacity * info.opacity;
          child.material.transparent = child.material.opacity < 1;
          child.material.depthWrite = child.material.opacity >= 0.999;
        });
      }
    }

    goToLocation(locationId, animate) {
      const arrangement = this.arrangementFor(locationId);
      if (!arrangement)
        return false;
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
      this.renderer.render(this.scene, this.camera);
      this.animationFrame = requestAnimationFrame(this.renderFrame);
    }

    dispose() {
      this.disposed = true;
      cancelAnimationFrame(this.animationFrame);
      this.resizeObserver.disconnect();
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
