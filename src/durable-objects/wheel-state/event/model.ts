import { z } from 'zod';

const AddEntryEventDataSchema = z.object({
  label: z.string(),
});
export type AddEntryEventData = z.infer<typeof AddEntryEventDataSchema>;
export type AddEntryWheelEvent = WheelEvent<'AddEntry', AddEntryEventData>;

const RemoveEntryEventDataSchema = z.object({
  label: z.string(),
});
export type RemoveEntryEventData = z.infer<typeof RemoveEntryEventDataSchema>;
export type RemoveEntryWheelEvent = WheelEvent<'RemoveEntry', RemoveEntryEventData>;

export type WheelEvent<Name extends string, Data extends object> = {
  name: Name;
  data: Data;
  createdAt: Date;
};

export type KnownWheelEvent = AddEntryWheelEvent | RemoveEntryWheelEvent;
export type RecordedWheelEvent = KnownWheelEvent & { id: number };
