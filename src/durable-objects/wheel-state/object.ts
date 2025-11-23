import { DurableObject } from 'cloudflare:workers';
import { AddEntryWheelEvent, RecordedWheelEvent } from './event/model';
import { EventRepository } from './event/repository';

/** A Durable Object's behavior is defined in an exported Javascript class */
export class WheelState extends DurableObject {
  #events: RecordedWheelEvent[] = [];
  #eventsRepo: EventRepository;

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
    });
  }

  public async listEvents(): Promise<RecordedWheelEvent[]> {
    return this.#events;
  }

  public async sayHello(name: string): Promise<string> {
    const event: AddEntryWheelEvent = {
      name: 'AddEntry',
      data: { label: name },
      createdAt: new Date(),
    };

    this.#events.push(await this.#eventsRepo.recordEvent(event));

    return `Hello, ${name}!`;
  }
}
