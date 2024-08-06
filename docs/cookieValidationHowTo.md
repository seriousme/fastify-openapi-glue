### Implementing cookie validation

The [OpenApi](https://www.openapis.org/) specification allows cookie validation, but Fastify itself does not validate or even parse cookies.

The `fastify-openapi-glue` plugin is intentionally designed to work without requiring additional 3rd party plugins.
However, it does provide a boolean option `addCookieSchema`  which tells it to insert JSON Schema describing OpenApi cookies into the Fastify [Routes options](https://fastify.dev/docs/latest/Reference/Routes/#routes-options).

Using this `addCookieSchema` option, one possible way to implement cookie validation in your application might be:
- Register a plugin for cookie parsing with Fastify (perhaps [fastify cookie plugin](https://github.com/fastify/fastify-cookie)).
- Listen for Fastify's [`onRoute` Application Hook](https://fastify.dev/docs/latest/Reference/Hooks/#onroute).
- In your `onRoute` handler:
  - Check to see if `fastify-openapi-glue` found cookie specifications that it added to the `routeOptions`.
  - If cookie schema is present, pre-compile it with Ajv and add the compiled schema to the `routeOptions.config` object.
- Register a global Fastify [`preHandler`](https://fastify.dev/docs/latest/Reference/Hooks/#prehandler)
- In your global `preHandler`:
  - See if the invoked route has a cookie validator (pre-compiled by your `onRoute` handler).
  - Validate the cookie (which your cookie parser should have already added to the `request`).
- With your customizations in place, register `fastify-openapi-glue`.

Example:
```javascript
// Register a plugin for cookie parsing
fastify.register(cookie);

// Hook into the route registration process to compile cookie schemas
fastify.addHook('onRoute', (routeOptions) => {
  const schema = routeOptions.schema;
  /*
   * schema.cookies will be added to the schema object if the
   * 'addCookieSchema' option is passed to fastify-openapi-glue.
   */
  if (schema?.cookies) {
    // Compile the cookie schema and store it in the route's context
    routeOptions.config = routeOptions.config || {};
    routeOptions.config.cookieValidator = ajv.compile(schema.cookies);
  }
});

// Pre-handler hook to validate cookies using the precompiled schema
fastify.addHook('preHandler', async (request, reply) => {
  // See if this route has been configured with a cookie validator.
  const cookieValidator = request.routeOptions.config?.cookieValidator;
  if (cookieValidator) {
    const valid = cookieValidator(request.cookies);
    if (!valid) {
      reply.status(400).send({error: 'Invalid cookies', details: cookieValidator.errors});
      throw new Error('Invalid cookies');
    }
  }
});

// Magic!
fastify.register(openapiGlue, options);
```
