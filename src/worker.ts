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

router.post('/:name/entries', async (ctx) => {
  // TODO: validate
  const { label } = await ctx.req.json();

  const obj = ctx.env.WHEEL_STATE.getByName(ctx.req.param('name'));

  await obj.addEntry(label);

  return new Response(null, { status: 201 });
});

// export our durable objects so Workers knows where to find them
export { WheelState } from './durable-objects/wheel-state/object';
// export the router, which is Workers compatible, to handle requests
export default router satisfies ExportedHandler<Env>;
