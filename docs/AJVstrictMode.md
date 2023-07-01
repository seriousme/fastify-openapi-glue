<h1 align="center">fastify-openapi-glue</h1>

## AJV strict mode

Fastify uses [AJV](https://ajv.js.org/) to check JSONschemas that are used for
[validation and serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/).

The [OpenApi](https://www.openapis.org/) specification allows for additions to
the schema specification that do not match JSONschema , e.g:

```json
"responses": {
    "200": {
      "description": "Did something",
      "schema": {
        "type": "string",
        "example": "Done"
      }
    },
    "404": {
      "description": "Didnt do something",
      "schema": {
        "type": "string",
        "example": "Failed"
      }
    }
  }
```

In this case the `example` attribute is not part of JSONschema and Fastify
(actually AJV) will throw an error along the lines of:

```
Error while starting the application: Error: Could not initiate module due to error: FastifyError: Failed building the validation schema for POST: /api/v1/user/{userId}/something, due to error strict mode: unknown keyword: "example"
```

This error can be prevented by telling Fastify to use AJV in non-strict mode.
This does not change the actual validation but it does allow for extra
attributes in the schema. See: https://ajv.js.org/options.html#strict for more details.

There are 2 ways to achieve this:

### Fastify start

If your code is a Fastify plug-in then adding:

```javascript
export const options = {
  ajv: {
    customOptions: {
      strict: false,
    },
  },
};
```

Will tell fastify start to apply this option. See:
[examples/petstore/index.js](../examples/petstore/index.js)

### Fastify factory

If you are setting up fastify in your own code then you can pass the non-strict
option to AJV:

```javascript
import Fastify from "fastify";
const fastify = Fastify(
  {
    ajv: {
      customOptions: {
        strict: false,
      },
    },
  },
);
```

See also: https://fastify.dev/docs/latest/Reference/Server#factory-ajv
