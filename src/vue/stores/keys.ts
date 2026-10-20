import type { InjectionKey } from "vue";
import type { ConnectionStore } from "./useConnection";
import type { ProjectStore } from "./useProject";
import type { VueEngineryStore } from "./useEngineryStore";

export const connectionKey: InjectionKey<ConnectionStore> = Symbol("connection");
export const projectKey: InjectionKey<ProjectStore> = Symbol("project");
export const engineryKey: InjectionKey<VueEngineryStore> = Symbol("enginery");
