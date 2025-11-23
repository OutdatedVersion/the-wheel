import { KnownWheelEvent, RecordedWheelEvent } from './model';

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
      const row = n.value;
      console.log(row);
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
