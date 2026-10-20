import { createApp } from "vue";
import App from "./vue/App.vue";
import "./style.css";
import { EngineryFactory } from "./core/EngineryFactory";
import { SwitchingLight } from "./core/enginery/SwitchingLight";
import { DimmingLight } from "./core/enginery/DimmingLight";
import { RgbLight } from "./core/enginery/RgbLight";
import { RgbwLight } from "./core/enginery/RgbwLight";
import { DynamicLight } from "./core/enginery/DynamicLight";
import { LightSensor } from "./core/enginery/LightSensor";
import { PresenceSensor } from "./core/enginery/PresenceSensor";
import { TunableWhiteLight } from "./core/enginery/TunableWhiteLight";

EngineryFactory.register("SwitchingLight", SwitchingLight);
EngineryFactory.register("DimmingLight", DimmingLight);
EngineryFactory.register("RgbLight", RgbLight);
EngineryFactory.register("RgbwLight", RgbwLight);
EngineryFactory.register("DynamicLight", DynamicLight);
EngineryFactory.register("LightSensor", LightSensor);
EngineryFactory.register("PresenceSensor", PresenceSensor);
EngineryFactory.register("TunableWhiteLight", TunableWhiteLight);

createApp(App).mount("#app");
