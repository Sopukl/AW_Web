export enum State {
  Hidden = "Hidden",
  Normal = "Normal",
  Monopoly = "Monopoly"
}

export class SubgineryState extends EventTarget {
  readonly type: string;
  private currentState = State.Normal;

  constructor(type: string) {
    super();
    this.type = type;
  }

  get state(): State {
    return this.currentState;
  }

  set state(value: State) {
    if (this.currentState === value)
      return;
    this.currentState = value;
    this.dispatchEvent(new Event("stateChanged"));
  }
}
