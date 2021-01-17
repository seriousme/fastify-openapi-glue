<h1 align="center">fastify-openapi-glue</h1>

## Bindings
When creating your service and/or your security handlers please beware of the bindings.
That means that when your service is called, `this` refers to the service object and not to Fastify !
Similarly when a security handler is called, `this` refers to the securityHandlers object and not to Fastify !

The rationale behind this is that any service integrations (e.g. database) should be handled by your service and not by Fastify. This enables you to test your service integration independently of Fastify.

### Workaround
If you ever have a need to have a reference to the Fastify instance you can pass the instance to your constructor.

E.g. something like:

```javascript
import Fastify from "fastify";
import openapiGlue from "fastify-openapi-glue";
import Service from "./service.js";

const fastify = new Fastify();
const service = new Service(fastify);

const specification = `myServiceSpec.json`;

fastify.register(
    openapiGlue,
    {
        specification,
        service
    }
)
```
