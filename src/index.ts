import { Hono } from 'hono';

const router = new Hono<{ Bindings: Env }>();

router.get('/', async (ctx) => {
  // Create a stub to open a communication channel with the Durable Object
  // instance named "foo".
  //
  // Requests from all Workers to the Durable Object instance named "foo"
  // will go to a single remote Durable Object instance.
  const stub = ctx.env.WHEEL_STATE.getByName('foo');

  // Call the `sayHello()` RPC method on the stub to invoke the method on
  // the remote Durable Object instance.
  const greeting = await stub.sayHello('world');

  return new Response(greeting);
});

export { WheelState } from './durable-objects/wheel-state';
export default router satisfies ExportedHandler<Env>;
