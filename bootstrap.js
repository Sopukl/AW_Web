import { EngineryFactory } from "./core/EngineryFactory.js";
import { EngineryStore } from "./core/EngineryStore.js";
import { SwitchingLight } from "./core/enginery/SwitchingLight.js";
import { DimmingLight } from "./core/enginery/DimmingLight.js";
import { RgbLight } from "./core/enginery/RgbLight.js";
import { useEngineryStore } from "./vue/stores/useEngineryStore.js";
import { useProject } from "./vue/stores/useProject.js";
import { useConnection } from "./vue/stores/useConnection.js";
import { createAppComponent } from "./vue/App.js";

EngineryFactory.register("SwitchingLight", SwitchingLight);
EngineryFactory.register("DimmingLight", DimmingLight);
EngineryFactory.register("RgbLight", RgbLight);

const coreEngineryStore = new EngineryStore();
const Root = {
  setup() {
    const enginery = useEngineryStore(coreEngineryStore);
    const project = useProject();
    const connection = useConnection(project, enginery);
    const App = createAppComponent({ enginery, project, connection });
    return () => globalThis.Vue.h(App);
  }
};

try {
  globalThis.Vue.createApp(Root).mount("#app");
} catch (error) {
  console.error(error);
  const note = document.createElement("p");
  note.className = "error";
  note.textContent = "Не удалось запустить интерфейс: " + (error.message || error);
  document.body.prepend(note);
}
