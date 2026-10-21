// @ts-nocheck
import * as THREE from "three";
import {
  buildModel,
  vector,
  COLOR_SCHEMES
} from "./buildModel";
import { Control } from "./Control";

export class ProjectThreeView {
    constructor(container, project, engineryStore, colorSchemeName) {
      if (!container)
        throw new Error("Не найден контейнер 3D-view");

      this.container = container;
      this.project = project;
      this.engineryStore = engineryStore;
      this.onControlClick = null;
      this.onControlHover = null;
      this.onNavigate = null;
      this.locations = new Map((project.locations || []).map((item) => [String(item.id), item]));
      this.models = new Map();
      this.engineryObjects = new Map();
      this.navigationObjects = [];
      this.engineryById = new Map(engineryStore.all().map((item) => [String(item.id), item]));
      this.colorSchemeName = COLOR_SCHEMES[colorSchemeName] ? colorSchemeName : "Awada";
      this.currentCenter = new THREE.Vector3();
      this.disposed = false;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(COLOR_SCHEMES[this.colorSchemeName].background);

      this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000000);
      this.camera.up.set(0, 0, 1);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.replaceChildren(this.renderer.domElement);
      this.raycaster = new THREE.Raycaster();
      this.pointer = new THREE.Vector2();
      this.handleNavigationClick = this.handleNavigationClick.bind(this);
      this.handleControlClick = this.handleControlClick.bind(this);
      this.handleControlHover = this.handleControlHover.bind(this);
      this.clearControlHover = this.clearControlHover.bind(this);
      this.renderer.domElement.addEventListener("click", this.handleNavigationClick);
      this.renderer.domElement.addEventListener("click", this.handleControlClick);
      this.renderer.domElement.addEventListener("pointermove", this.handleControlHover);
      this.renderer.domElement.addEventListener("pointerleave", this.clearControlHover);

      for (const model of project.models || []) {
        console.log("model", model);
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

    handleControlClick(event) {
      if (this.hoveredControl && typeof this.onControlClick === "function")
        this.onControlClick(this.hoveredControl.userData.engineryId, event.clientX, event.clientY);
    }

    setHoveredControl(object) {
      if (this.hoveredControl === object)
        return;
      this.hoveredControl = object || null;
      this.renderer.domElement.style.cursor = this.hoveredControl ? "pointer" : "";
      if (typeof this.onControlHover === "function")
        this.onControlHover(this.hoveredControl ? this.hoveredControl.userData.engineryId : null);
    }

    handleControlHover(event) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
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
      });
      for (const controls of this.engineryObjects.values())
        controls.forEach((control) => control.setScheme(scheme));
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
        for (const control of objects) {
          control.setPresented(isPresented);
          control.traverse((child) => {
            if (!child.material)
              return;
            child.material.userData.notPresented = !isPresented;
          });
        }
      }
    }

    updateEngineryState(engineryId, field, value) {
      this.engineryStore.updateState(engineryId, field, value);
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
          if (child instanceof Control)
            child.setModelOpacity(info.opacity);
        });
        object.traverse((child) => {
          if (!child.material)
            return;
          if (child.material.userData.enginery)
            return;
          const baseOpacity = child.material.userData.baseOpacity === undefined
            ? 1 : child.material.userData.baseOpacity;
          child.material.opacity = baseOpacity * info.opacity;
          child.material.transparent = child.material.opacity < 1;
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

    renderScene() {
      this.renderer.render(this.scene, this.camera);
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
      for (const controls of this.engineryObjects.values())
        controls.forEach((control) => control.paint());
      this.renderScene();
      this.animationFrame = requestAnimationFrame(this.renderFrame);
    }

    dispose() {
      this.disposed = true;
      cancelAnimationFrame(this.animationFrame);
      this.resizeObserver.disconnect();
      for (const controls of this.engineryObjects.values())
        controls.forEach((control) => control.dispose());
      this.renderer.domElement.removeEventListener("click", this.handleNavigationClick);
      this.renderer.domElement.removeEventListener("click", this.handleControlClick);
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

