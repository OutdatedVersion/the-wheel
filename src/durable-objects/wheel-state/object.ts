import { DurableObject } from 'cloudflare:workers';
import { EventRepository } from './event/repository';
import { WheelEvent } from '../../gen/the_wheel/v1/events_pb';
import { AddEntryEventDataSchema, WheelEventDataSchema, WheelEventSchema } from '../../gen/the_wheel/v1/events_pb';
import { create } from '@bufbuild/protobuf';

/** A Durable Object's behavior is defined in an exported Javascript class */
export class WheelState extends DurableObject {
  #events: WheelEvent[] = [];
  #eventsRepo: EventRepository;

  #entries = new Set<string>();

  /**
   * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
   * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
   *
   * @param ctx - The interface for interacting with Durable Object state
   * @param env - The interface to reference bindings declared in wrangler.jsonc
   */
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.#eventsRepo = new EventRepository(ctx.storage.sql);

    ctx.blockConcurrencyWhile(async () => {
      await this.#eventsRepo.init();
      this.#events = await this.#eventsRepo.loadEvents();

      // TODO: replay events to reconstruct entries
    });
  }

  public async purge(): Promise<void> {
    this.#events = [];
    this.ctx.storage.deleteAll();
  }

  public async listEvents(): Promise<WheelEvent[]> {
    return this.#events;
  }

  public async listEntries(): Promise<string[]> {
    return Array.from(this.#entries);
  }

  public async addEntry(label: string): Promise<void> {
    if (this.#entries.has(label)) {
      // TODO ?
      return;
    }

    const eventData = create(WheelEventDataSchema, {
      eventData: {
        case: 'addEntry',
        value: create(AddEntryEventDataSchema, { label }),
      },
    });

    this.#events.push(await this.#eventsRepo.recordEvent(eventData));
    this.#entries.add(label);
  }
}
