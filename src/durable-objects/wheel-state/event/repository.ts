import { z } from 'zod';
import { WheelEvent, WheelEventData, WheelEventDataSchema, WheelEventSchema } from '../../../gen/the_wheel/v1/events_pb';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';

const WheelEventsRowSchema = z.object({
  id: z.string(),
  data: z.instanceof(ArrayBuffer),
  created_at: z.number(),
});

const createWheelEvent = (eventData: WheelEventData, opts?: { id?: string; createdAt?: Date }): WheelEvent => {
  const id = opts?.id ?? crypto.randomUUID();
  const createdAt = opts?.createdAt ?? new Date();
  return create(WheelEventSchema, {
    id,
    data: eventData,
    createdAt: timestampFromDate(createdAt),
  });
};

export class EventRepository {
  constructor(private sql: SqlStorage) {}

  public async init(): Promise<void> {
    this.sql.exec(`
        CREATE TABLE IF NOT EXISTS wheel_events (
          id TEXT PRIMARY KEY,
          data BLOB NOT NULL,
          created_at DATETIME NOT NULL
        );
    `);
  }

  async loadEvents(): Promise<WheelEvent[]> {
    const cursor = this.sql.exec('SELECT id, data, created_at FROM wheel_events ORDER BY created_at ASC;');

    const events: WheelEvent[] = [];
    for (let next = cursor.next(); !next.done; next = cursor.next()) {
      const result = await WheelEventsRowSchema.safeParseAsync(next.value);
      if (!result.success) {
        // TODO
        console.error('malformed row', result.error);
        continue;
      }
      const row = result.data;

      const eventData = fromBinary(WheelEventDataSchema, new Uint8Array(row.data));
      const event = createWheelEvent(eventData, {
        id: row.id,
        createdAt: new Date(row.created_at),
      });

      events.push(event);
    }

    return events;
  }

  async recordEvent(eventData: WheelEventData): Promise<WheelEvent> {
    const eventId = crypto.randomUUID();
    const createdAt = new Date();
    const event = createWheelEvent(eventData, {
      id: eventId,
      createdAt,
    });

    this.sql.exec(
      'INSERT INTO wheel_events (id, data, created_at) VALUES (?, ?, ?);',
      eventId,
      toBinary(WheelEventDataSchema, eventData),
      createdAt.getTime(),
    );

    return event;
  }
}
