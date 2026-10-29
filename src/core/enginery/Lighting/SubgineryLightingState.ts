import { SubgineryState } from "../../SubgineryState";

export enum Page {
  Light = "Light",
  Sensors = "Sensors",
  Area = "Area"
}

export class SubgineryLightingState extends SubgineryState {
  private currentPage = Page.Light;

  constructor() {
    super("Lighting");
  }

  get page(): Page {
    return this.currentPage;
  }

  set page(value: Page) {
    if (this.currentPage === value)
      return;
    this.currentPage = value;
    this.dispatchEvent(new Event("pageChanged"));
  }
}
