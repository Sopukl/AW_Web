// @ts-nocheck
export class Enginery {
  constructor(item, project) {
    this.item = item;
    this.id = item.id;
    this.type = item.type;
    this.project = project;
    this.state = {};
    this.presented = false;
  }

  updateState(field, value) {
    while (value !== null && typeof value === "object" &&
           Object.prototype.hasOwnProperty.call(value, "value"))
      value = value.value;
    this.state[field] = value;
  }

  applyToObjects(_objects, _scheme, _modelOpacity) {}
  applyScheme(_objects, _scheme) {}
  getPopoverComponent() { return null; }
  getPopoverProps() { return { enginery: this }; }
}
