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
  const CONSTRUCTION_LAYER = 1;
  const DEFAULT_SHADOW_OPTIONS = {
    offsetX: 5,
    offsetY: 5,
    opacity: 0.8,
    shadowColor: "#000000"
  };

  function isRenderSurface(surface) {
    return surface.Signature === "S" || surface.Signature === 83;
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
      group.add(new THREE.Mesh(fillGeometry, material));
    }

    if (contourIndices.length || (options.enginery && fillGeometry)) {
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
      group.add(new THREE.LineSegments(geometry, material));
    }

    return group;
  }

  function buildModel(model, engineryById, engineryObjects, colorScheme) {
    const group = new THREE.Group();
    group.name = "model-" + model.id;
    group.userData.modelId = model.id;
    for (const surface of model.constructionSurfaces || []) {
      const construction = buildSurface(surface);
      construction.traverse((object) => object.layers.set(CONSTRUCTION_LAYER));
      group.add(construction);
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
    constructor(container, project, colorSchemeName, shadowOptions) {
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
      this.engineryById = new Map((project.engineries || []).map((item) => [String(item.id), item]));
      this.colorSchemeName = COLOR_SCHEMES[colorSchemeName] ? colorSchemeName : "Awada";
      this.shadowOptions = Object.assign({}, DEFAULT_SHADOW_OPTIONS, shadowOptions || {});
      this.currentCenter = new THREE.Vector3();
      this.disposed = false;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(COLOR_SCHEMES[this.colorSchemeName].background);

      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000000);
      this.camera.up.set(0, 0, 1);
      this.camera.layers.enable(CONSTRUCTION_LAYER);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.replaceChildren(this.renderer.domElement);

      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x66717a, 1.25));
      const light = new THREE.DirectionalLight(0xffffff, 1.75);
      light.position.set(-0.5, -0.7, 1);
      this.scene.add(light);

      for (const model of project.models || []) {
        const object = buildModel(
          model,
          this.engineryById,
          this.engineryObjects,
          COLOR_SCHEMES[this.colorSchemeName]
        );
        object.visible = false;
        this.models.set(String(model.id), object);
        this.scene.add(object);
      }

      this.initShadow();
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(container);
      this.resize();
      this.renderFrame = this.renderFrame.bind(this);
      this.animationFrame = requestAnimationFrame(this.renderFrame);
    }

    initShadow() {
      const targetOptions = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        depthBuffer: true,
        stencilBuffer: false
      };
      this.shadowMaskTarget = new THREE.WebGLRenderTarget(1, 1, targetOptions);
      this.shadowBlurTarget = new THREE.WebGLRenderTarget(1, 1, Object.assign({}, targetOptions, {
        depthBuffer: false
      }));
      this.shadowMaskTarget.texture.colorSpace = THREE.NoColorSpace;
      this.shadowBlurTarget.texture.colorSpace = THREE.NoColorSpace;

      this.shadowMaskMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
      });
      this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.postGeometry = new THREE.PlaneGeometry(2, 2);

      this.blurMaterial = new THREE.ShaderMaterial({
        uniforms: {
          sourceTexture: { value: this.shadowMaskTarget.texture },
          texelSize: { value: new THREE.Vector2(1, 1) }
        },
        vertexShader: [
          "varying vec2 vUv;",
          "void main() {",
          "  vUv = uv;",
          "  gl_Position = vec4(position.xy, 0.0, 1.0);",
          "}"
        ].join("\n"),
        fragmentShader: [
          "uniform sampler2D sourceTexture;",
          "uniform vec2 texelSize;",
          "varying vec2 vUv;",
          "void main() {",
          "  float mask = 0.0;",
          "  for (int y = -2; y <= 2; ++y) {",
          "    for (int x = -2; x <= 2; ++x) {",
          "      vec2 shift = vec2(float(x), float(y)) * texelSize;",
          "      mask += texture2D(sourceTexture, vUv + shift).r;",
          "    }",
          "  }",
          "  mask /= 25.0;",
          "  gl_FragColor = vec4(vec3(mask), 1.0);",
          "}"
        ].join("\n"),
        depthTest: false,
        depthWrite: false
      });
      this.blurScene = new THREE.Scene();
      this.blurScene.add(new THREE.Mesh(this.postGeometry, this.blurMaterial));

      this.shadowCompositeMaterial = new THREE.ShaderMaterial({
        uniforms: {
          shadowTexture: { value: this.shadowBlurTarget.texture },
          texelSize: { value: new THREE.Vector2(1, 1) },
          offset: { value: new THREE.Vector2() },
          shadowColor: { value: new THREE.Color() },
          shadowOpacity: { value: 0.8 }
        },
        vertexShader: [
          "varying vec2 vUv;",
          "void main() {",
          "  vUv = uv;",
          "  gl_Position = vec4(position.xy, 0.0, 1.0);",
          "}"
        ].join("\n"),
        fragmentShader: [
          "uniform sampler2D shadowTexture;",
          "uniform vec2 texelSize;",
          "uniform vec2 offset;",
          "uniform vec3 shadowColor;",
          "uniform float shadowOpacity;",
          "varying vec2 vUv;",
          "void main() {",
          "  vec2 screenOffset = vec2(offset.x, -offset.y) * texelSize;",
          "  float mask = texture2D(shadowTexture, vUv - screenOffset).r;",
          "  gl_FragColor = vec4(shadowColor, mask * shadowOpacity);",
          "}"
        ].join("\n"),
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      this.shadowScene = new THREE.Scene();
      this.shadowScene.add(new THREE.Mesh(this.postGeometry, this.shadowCompositeMaterial));
      this.renderSize = new THREE.Vector2();
      this.setShadowOptions(this.shadowOptions);
    }

    setShadowOptions(options) {
      options = options || {};
      if (options.offset && typeof options.offset === "object") {
        if (options.offset.x !== undefined)
          options.offsetX = options.offset.x;
        if (options.offset.y !== undefined)
          options.offsetY = options.offset.y;
      }
      if (Number.isFinite(Number(options.offsetX)))
        this.shadowOptions.offsetX = Number(options.offsetX);
      if (Number.isFinite(Number(options.offsetY)))
        this.shadowOptions.offsetY = Number(options.offsetY);
      if (Number.isFinite(Number(options.opacity)))
        this.shadowOptions.opacity = THREE.MathUtils.clamp(Number(options.opacity), 0, 1);
      if (options.shadowColor !== undefined)
        this.shadowOptions.shadowColor = String(options.shadowColor);

      if (this.shadowCompositeMaterial) {
        const uniforms = this.shadowCompositeMaterial.uniforms;
        const pixelRatio = this.renderer.getPixelRatio();
        uniforms.offset.value.set(
          this.shadowOptions.offsetX * pixelRatio,
          this.shadowOptions.offsetY * pixelRatio
        );
        uniforms.shadowOpacity.value = this.shadowOptions.opacity;
        uniforms.shadowColor.value.set(this.shadowOptions.shadowColor);
      }
      return Object.assign({}, this.shadowOptions);
    }

    resize() {
      const width = Math.max(this.container.clientWidth, 1);
      const height = Math.max(this.container.clientHeight, 1);
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.getDrawingBufferSize(this.renderSize);
      const renderWidth = Math.max(Math.floor(this.renderSize.x), 1);
      const renderHeight = Math.max(Math.floor(this.renderSize.y), 1);
      this.shadowMaskTarget.setSize(renderWidth, renderHeight);
      this.shadowBlurTarget.setSize(renderWidth, renderHeight);
      this.blurMaterial.uniforms.texelSize.value.set(1 / renderWidth, 1 / renderHeight);
      this.shadowCompositeMaterial.uniforms.texelSize.value.set(1 / renderWidth, 1 / renderHeight);
      this.setShadowOptions(this.shadowOptions);
    }

    setColorScheme(name) {
      const scheme = COLOR_SCHEMES[name];
      if (!scheme)
        return false;
      this.colorSchemeName = name;
      this.scene.background.set(scheme.background);
      this.scene.traverse((object) => {
        const material = object.material;
        if (!material || !material.userData.enginery)
          return;
        const color = scheme.lighting[material.userData.engineryType];
        if (color)
          material.color.set(color);
      });
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

    setLocationEngineries(locationId) {
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
          object.visible = isPresented;
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
          if (child.material.userData.fixedOpacity) {
            child.material.opacity = 1;
            child.material.transparent = false;
            child.material.depthWrite = true;
            return;
          }
          child.material.userData.baseOpacity = opacity;
          child.material.opacity = opacity * modelOpacity;
          child.material.transparent = child.material.opacity < 1;
          child.material.depthWrite = child.material.opacity >= 0.999;
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
          if (child.material.userData.fixedOpacity) {
            child.material.opacity = 1;
            child.material.transparent = false;
            child.material.depthWrite = true;
            return;
          }
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

    renderSceneWithShadow() {
      const renderer = this.renderer;
      const previousTarget = renderer.getRenderTarget();
      const previousAutoClear = renderer.autoClear;
      const previousClearColor = renderer.getClearColor(new THREE.Color());
      const previousClearAlpha = renderer.getClearAlpha();
      const previousBackground = this.scene.background;
      const previousOverride = this.scene.overrideMaterial;
      const previousLayers = this.camera.layers.mask;

      renderer.autoClear = false;

      this.scene.background = null;
      this.scene.overrideMaterial = this.shadowMaskMaterial;
      this.camera.layers.set(CONSTRUCTION_LAYER);
      renderer.setRenderTarget(this.shadowMaskTarget);
      renderer.setClearColor(0x000000, 1);
      renderer.clear(true, true, true);
      renderer.render(this.scene, this.camera);

      this.scene.overrideMaterial = previousOverride;
      this.camera.layers.mask = previousLayers;
      renderer.setRenderTarget(this.shadowBlurTarget);
      renderer.setClearColor(0x000000, 1);
      renderer.clear(true, false, false);
      renderer.render(this.blurScene, this.postCamera);

      renderer.setRenderTarget(null);
      renderer.setClearColor(previousBackground || previousClearColor, 1);
      renderer.clear(true, true, true);
      renderer.render(this.shadowScene, this.postCamera);
      renderer.clearDepth();
      renderer.render(this.scene, this.camera);

      this.scene.background = previousBackground;
      this.scene.overrideMaterial = previousOverride;
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
      this.renderSceneWithShadow();
      this.animationFrame = requestAnimationFrame(this.renderFrame);
    }

    dispose() {
      this.disposed = true;
      cancelAnimationFrame(this.animationFrame);
      this.resizeObserver.disconnect();
      this.shadowMaskTarget.dispose();
      this.shadowBlurTarget.dispose();
      this.shadowMaskMaterial.dispose();
      this.blurMaterial.dispose();
      this.shadowCompositeMaterial.dispose();
      this.postGeometry.dispose();
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
