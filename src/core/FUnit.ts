export enum FUnitState {
  IsEmpty = 0,
  IsInvalid = 1,
  IsValid = 2
}

export class FUnit<T> {
  value: T | undefined;
  state = FUnitState.IsEmpty;

  constructor(private readonly validator: (value: unknown) => value is T) {}

  update(value: unknown): boolean {
    if (!this.validator(value)) {
      this.state = FUnitState.IsInvalid;
      return false;
    }
    this.value = value;
    this.state = FUnitState.IsValid;
    return true;
  }
}

export const booleanUnit = (): FUnit<boolean> =>
  new FUnit<boolean>((value): value is boolean => typeof value === "boolean");

export const numberUnit = (): FUnit<number> =>
  new FUnit<number>((value): value is number =>
    typeof value === "number" && Number.isFinite(value)
  );

export const stringUnit = (): FUnit<string> =>
  new FUnit<string>((value): value is string => typeof value === "string");
