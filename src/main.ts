import { createApp } from "vue";
import App from "./vue/App.vue";
import "./style.css";
import { EngineryFactory } from "./core/EngineryFactory";
import { SwitchingLight } from "./core/enginery/SwitchingLight";
import { DimmingLight } from "./core/enginery/DimmingLight";
import { RgbLight } from "./core/enginery/RgbLight";

EngineryFactory.register("SwitchingLight", SwitchingLight);
EngineryFactory.register("DimmingLight", DimmingLight);
EngineryFactory.register("RgbLight", RgbLight);

createApp(App).mount("#app");
