import type { FUnit } from "./FUnit";

export interface EnginerySource {
  id: number;
  key?: string;
  name?: string;
  type: string;
  [key: string]: unknown;
}

export class EngineryObject extends EventTarget {
  readonly id: number;
  readonly key: string;
  readonly name: string;
  readonly type: string;
  readonly item: EnginerySource;
  readonly project: unknown;
  readonly units: Record<string, FUnit<unknown>> = {};

  constructor(item: EnginerySource, project: unknown) {
    super();
    if (!Number.isInteger(item.id) || item.id < -2147483648 || item.id > 2147483647)
      throw new RangeError(`Enginery id must be int32: ${item.id}`);
    this.item = item;
    this.id = item.id;
    this.key = String(item.key ?? "");
    this.name = String(item.name ?? "");
    this.type = item.type;
    this.project = project;
  }

  protected register<T>(field: string, unit: FUnit<T>): FUnit<T> {
    unit.bindChanged(() => this.dispatchEvent(new Event("changed")));
    this.units[field] = unit as FUnit<unknown>;
    return unit;
  }

  updateState(field: string, value: unknown): boolean {
    while (
      value !== null &&
      typeof value === "object" &&
      Object.prototype.hasOwnProperty.call(value, "value")
    ) {
      value = (value as { value: unknown }).value;
    }
    const unit = this.units[field];
    if (!unit)
      return false;
    return unit.update(value);
  }

  topicFields(): string[] {
    return Object.keys(this.units);
  }

  getPopoverComponent(): string | null { return null; }
  getPopoverProps(): { enginery: EngineryObject } { return { enginery: this }; }
}
