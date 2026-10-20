export type Id = string | number;
export type StateValue = unknown;

export interface RawEnginery {
  id: Id;
  type: string;
  [key: string]: unknown;
}

export interface RawTransition {
  locationID: Id;
  sameLevel?: boolean;
}

export interface RawLocationModel {
  id: Id;
  transitions?: RawTransition[];
  controls?: Array<{ engineryID: Id }>;
}

export interface RawLocation {
  id: Id;
  title?: string;
  label?: string;
  name?: string;
  models?: RawLocationModel[];
  arrangements?: unknown[];
  [key: string]: unknown;
}

export interface ProjectData {
  id: Id;
  name?: string;
  cloudCode?: string;
  rootLocationID?: Id;
  files?: string[];
  models?: unknown[];
  engineries?: RawEnginery[];
  subgineries?: Record<string, unknown>[];
  servers?: Record<string, unknown>[];
  managers?: Record<string, unknown>[];
  providers?: Record<string, unknown>[];
  locations?: RawLocation[];
}

export interface ColorScheme {
  background: string;
  navigation: string;
  generic: string;
  lighting: Record<string, string>;
}

export interface RenderMaterial {
  color?: { set(value: string | number): void };
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  userData: Record<string, unknown>;
}

export interface RenderObject {
  material?: RenderMaterial;
  traverse(callback: (object: RenderObject) => void): void;
}
