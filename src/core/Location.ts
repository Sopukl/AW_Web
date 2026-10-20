// @ts-nocheck
export class Location {
  constructor(item) {
    Object.assign(this, item);
    this.item = item;
  }

  get titleText() {
    return this.title || this.label ||
      String(this.name || "").replace(/\*$/, "") ||
      ("Локация " + this.id);
  }
}
