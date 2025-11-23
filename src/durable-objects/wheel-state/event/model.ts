export type AddEntryWheelEvent = WheelEvent<'AddEntry', AddEntryEventData>;
export interface AddEntryEventData {
  label: string;
}

export type RemoveEntryWheelEvent = WheelEvent<'RemoveEntry', RemoveEntryEventData>;
export interface RemoveEntryEventData {
  label: string;
  idk: boolean;
}

export type WheelEvent<Name extends string, Data extends object> = {
  name: Name;
  data: Data;
  createdAt: Date;
};

export type KnownWheelEvent = AddEntryWheelEvent | RemoveEntryWheelEvent;
export type RecordedWheelEvent = KnownWheelEvent & { id: number };
