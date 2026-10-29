// @ts-nocheck
export class Location {
  constructor(item, subgineries = []) {
    Object.assign(this, item);
    this.item = item;
    this.subgineries = new Map(
      subgineries.map((subginery) => [subginery.type, subginery])
    );
  }

  get titleText() {
    return this.title || this.label ||
      String(this.name || "").replace(/\*$/, "") ||
      ("Локация " + this.id);
  }
}
