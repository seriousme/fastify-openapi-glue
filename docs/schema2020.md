<h1 align="center">fastify-openapi-glue</h1>

## OpenApi 3.1 and JSON schema draft 2020-12

Fastify uses [AJV](https://ajv.js.org/) to check JSON schemas that are used for
[validation and serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/).

At the time of writing (April 2025) AJV uses [JSON schema draft-07 as default version of JSONschema](https://ajv.js.org/json-schema.html#json-schema-versions).

The OpenApi specifications until 3.1 (e.g. [3.0.4](https://spec.openapis.org/oas/v3.0.4.html#schema-object)) specify JSON schema draft-05, this works fine with AJV's draft-07.

The OpenApi specifications from 3.1 (e.g. [3.2.0](https://spec.openapis.org/oas/v3.2.0.html#schema-object)) specify JSON schema draft-2020-12 which works fine with AJV's draft-07 most of the time but has some new additions like `unevaluatedProperties` and even some breaking changes, see https://ajv.js.org/json-schema.html#json-schema-versions.

If you have/need these new additions in your OpenApi specification you need to tell `Fastify` to use `AJV` with `2020` schema.

e.g. something like:
```js
import openapiGlue from "fastify-openapi-glue";
import { Service } from "./service.js";
import { Security } from "./security.js";
import { Ajv2020 } from "ajv/dist/2020.js";

const ajv = new Ajv2020({
	removeAdditional: 'all',
	useDefaults: true,
	coerceTypes: 'array',
  strict: true
});

const opts = {
  specification: `${currentDir}/petstore-openapi.v3.json`,
  serviceHandlers: new Service(),
  securityHandlers: new Security(),
  prefix: "v1",
};

const fastify = Fastify();
fastify.setValidatorCompiler(({ schema, method, url, httpPart }) => {
	return ajv.compile(schema)
})

fastify.register(fastifyOpenapiGlue, opts);
```

See also: https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/#validation
