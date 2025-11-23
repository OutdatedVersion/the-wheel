import { z } from 'zod';
import { KnownWheelEvent, RecordedWheelEvent } from './model';

const WheelEventsRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  data: z.string(),
  created_at: z.number(),
});

export class EventRepository {
  constructor(private sql: SqlStorage) {}

  public async init(): Promise<void> {
    this.sql.exec(`
	CREATE TABLE IF NOT EXISTS wheel_events (
		id INTEGER PRIMARY KEY,
		name TEXT,
		data JSONB,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
  `);
  }

  async loadEvents(): Promise<RecordedWheelEvent[]> {
    const resp = this.sql.exec('SELECT id, name, data, created_at FROM wheel_events ORDER BY created_at ASC;');

    const events: RecordedWheelEvent[] = [];
    while (true) {
      const n = resp.next();
      if (n.done) {
        break;
      }

      const result = await WheelEventsRowSchema.safeParseAsync(n.value);
      if (!result.success) {
        // TODO
        console.error('malformed row', result.error);
        continue;
      }

      let data;
      try {
        data = JSON.parse(result.data.data);
      } catch (error) {
        // TODO
        console.error('failed to parse event data', error);
        continue;
      }

      events.push({
        id: result.data.id,
        name: result.data.name as KnownWheelEvent['name'],
        data: data as KnownWheelEvent['data'],
        createdAt: new Date(result.data.created_at),
      });
    }

    return events;
  }

  async recordEvent(event: KnownWheelEvent): Promise<RecordedWheelEvent> {
    const resp = this.sql.exec(
      'INSERT INTO wheel_events (name, data, created_at) VALUES (?, ?, ?) RETURNING id;',
      event.name,
      JSON.stringify(event.data),
      event.createdAt.getTime(),
    );
    const row = resp.one();

    if (typeof row.id !== 'number') {
      throw new Error('malformed row returned');
    }

    const recorded = { id: row.id, ...event };
    return recorded;
  }
}
