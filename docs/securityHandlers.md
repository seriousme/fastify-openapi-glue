<h1 align="center">fastify-openapi-glue</h1>

## SecurityHandlers
The [OpenApi](https://www.openapis.org/) `Operation` object allows for security requirements that specify which security scheme(s) should be applied to this operation. OpenApi also allows for global security requirements via the `/components/security` property (v3) or the `/security` property (v2).

You can specify your own securityHandlers with the `securityHandlers` option.
If the provided object has an `initialize` function then fastify-openapi-glue will call this function with the `/components/securitySchemes` property (v3) or the `/securityDefinitions` property (v2) of the specification provided.

### Example

In the petstore example specification there is a section:
```json
"/pet": {
      "post": {
       ...
        "summary": "Add a new pet to the store",
        "description": "",
        "operationId": "addPet",
        ...
        "security": [
          {
            "petstore_auth": [
              "write:pets",
              "read:pets"
            ]
          }
        ],
```

If you provide a securityHandler called `petstore_auth` then it will be called as `petstore_auth(request,reply, params)` where request and reply will be fastify request and reply objects and params contains `["write:pets", "read:pets"]`.

If you want authentication to succeed you can simply return. If you want authentication to fail you can just throw an error. 

If your error contains a `statusCode` property then the status code of the last failing handler will be passed to fastify. The default status code that is returned upon validation failure is `401`.

Any errors that result from `securityHandlers` are available to registered error handlers. E.g.:
```javascript
  fastify.setErrorHandler((err, req, reply) => {
    reply.code(err.statusCode).send(err);
  });
```
will return errors originating from the securityHandlers as well in `err.errors`.
**Please make sure this does not expose sensitive information to the requestor!**

You can use `err.errors` also to trigger other behaviour in a registered error handler.

For a more elaborate example see the [examples/generatedProject](/examples/generatedProject) folder.
