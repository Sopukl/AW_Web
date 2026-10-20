export type Id = string | number;
export type StateValue = unknown;

export interface RawEnginery {
  id: number;
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

