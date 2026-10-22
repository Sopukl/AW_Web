import type { EngineryObject } from "./EngineryObject";
import type { FUnit } from "./FUnit";

export interface SubginerySource {
  type: string;
  id: number;
  key?: string;
  name?: string;
  locationID: number;
  engineries?: number[];
  [key: string]: unknown;
}

export class SubgineryObject extends EventTarget {
  readonly id: number;
  readonly key: string;
  readonly name: string;
  readonly type: string;
  readonly locationID: number;
  readonly item: SubginerySource;
  readonly project: any;
  readonly engineries: EngineryObject[];
  readonly units: Record<string, FUnit<unknown>> = {};

  constructor(item: SubginerySource, project: any) {
    super();
    this.item = item;
    this.project = project;
    this.id = item.id;
    this.key = String(item.key ?? "");
    this.name = String(item.name ?? "");
    this.type = item.type;
    this.locationID = item.locationID;
    const byId = new Map(
      (project.engineries || []).map((enginery: EngineryObject) => [
        String(enginery.id),
        enginery
      ])
    );
    this.engineries = (item.engineries || [])
      .map((id) => byId.get(String(id)))
      .filter((enginery): enginery is EngineryObject => !!enginery);
  }

  protected register<T>(entry: string, unit: FUnit<T>): FUnit<T> {
    unit.bindChanged(() => this.dispatchEvent(new Event("changed")));
    this.units[entry] = unit as FUnit<unknown>;
    return unit;
  }

  updateState(entry: string, value: unknown): boolean {
    while (
      value !== null &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, "value")
    ) {
      value = (value as { value: unknown }).value;
    }
    return this.units[entry]?.update(value) ?? false;
  }

  topicFields(): string[] {
    return Object.keys(this.units);
  }

  classId(entry: string): string {
    return `${this.type}_${entry}`;
  }
}
