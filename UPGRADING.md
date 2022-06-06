# Upgrading Fastify OpenApi Glue

## From 2.x to 3.x

This is a major change with the following breaking changes:

### ESM module

`Fastify OpenApi Glue` is now an ESM module. If your code contains:

```javascript
const openapiGlue = require("fastify-openapi-glue");
``` 

You now need to use:

```javascript
const openapiGlue = await import("fastify-openapi-glue");
```

### AJV: 
`Fastify OpenApi Glue` now fully relies on AJV instance provided by Fastify.
So if you want to change AJV's behaviour you need to add your configuration to Fastify instead of passing it to `Fastify OpenApi Glue`. The options `noAdditional`, `ajvOptions` and `defaultAJV` have been deprecated. The new behaviour is identical to `defaultAJV:true` in 2.x.

E.g. if you had:

```javascript
import openapiGlue from "fastify-openapi-glue";
import Service from "./service.js";
import Security from "./security.js";

const options = {
  specification: `${currentDir}/petstore-openapi.v3.json`,
  service: new Service(),
  securityHandlers: new Security(),
  prefix: "v1",
  noAdditional: true,
  ajvOptions: {
    formats: {
      "custom-format": /\d{2}-\d{4}/
    }
  }
};

fastify.register(openapiGlue, options);

```

You now need to pass the AJV options to Fastify at startup. (see: https://www.fastify.io/docs/latest/Reference/Server/#ajv) or add them to your own AJV instance (see: https://www.fastify.io/docs/latest/Reference/Validation-and-Serialization/#schema-validator).  The `noAdditional:true` flag should be mapped to AJV's `removeAdditional:false` option (see: https://ajv.js.org/options.html#removeadditional)

### service and securityhandlers options:

In version 2.x you could either pass:
- an object or a class instance
- a name (to be interpreted as file name)
- a function (that would be executed)

as values to these parameters:
In 3.x the `name` and `function` values have been removed. So you need to `import` or `require` code files yourself and if you passed a function that resulted in an object or class instance you now need to call that function yourself.


## From 1.x to 2.x
Just make sure that you use Fastify > 3.0.0 as 1.x is only compatible with Fastify 2.x.

