import { Hono } from 'hono';

const router = new Hono<{ Bindings: Env }>().basePath('/api');

router.get('/:name/events', async (ctx) => {
  const obj = await ctx.env.WHEEL_STATE.getByName(ctx.req.param('name'));

  return ctx.json({ events: await obj.listEvents() });
});

router.delete('/:name', async (ctx) => {
  const obj = await ctx.env.WHEEL_STATE.getByName(ctx.req.param('name'));

  await obj.purge();

  return new Response(null, { status: 204 });
});

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

  return new Response(null, { status: 201 });
});

// export our durable objects so Workers knows where to find them
export { WheelState } from './durable-objects/wheel-state/object';
// export the router, which is Workers compatible, to handle requests
export default router satisfies ExportedHandler<Env>;
