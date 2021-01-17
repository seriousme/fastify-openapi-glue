<h1 align="center">fastify-openapi-glue</h1>

## OpenApi V3 servers

The [OpenApi](https://www.openapis.org/) V3 specification allows for multiple servers, e.g:
```json
{
  "servers": [
    {
      "url": "https://development.gigantic-server.com/dev/v1",
      "description": "Development server"
    },
    {
      "url": "https://staging.gigantic-server.com/staging/v1",
      "description": "Staging server"
    },
    {
      "url": "https://api.gigantic-server.com/v1",
      "description": "Production server"
    }
  ]
}

```

but also allows for variables in server urls:

```json
{
  "servers": [
    {
      "url": "https://{username}.gigantic-server.com:{port}/{basePath}",
      "description": "The production API server",
      "variables": {
        "username": {
          "default": "demo",
          "description": "this value is assigned by the service provider, in this example `gigantic-server.com`"
        },
        "port": {
          "enum": [
            "8443",
            "443"
          ],
          "default": "8443"
        },
        "basePath": {
          "default": "v2"
        }
      }
    }
  ]
}
```

Fastify-openapi-glue does not know on which server and with what parameters the developer wants to host their service. So if you need to have a prefix then the ['prefix' option](../README.md#options) might be able to help you out.

### Multiple prefixes

The 'prefix' option only allows for a single value. 
However since the result produced by fastify-openapi-glue is a fastify plugin there is nothing that prevents you from creating multiple plugins on multiple prefixes and loading them all up in Fastify. E.g. something along the lines of:

```javascript
import Fastify from "fastify";
import openapiGlue from "fastify-openapi-glue";
import DevService from "./dev/service.js";
import StagingService from "./staging/service.js";
import ProdService from "./prod/service.js";

const fastify = new Fastify();
const specification = `./petstore-openapi.v3.json`;

fastify.register(
    openapiGlue,
    {
        specification,
        service: new DevService(),
        prefix: "dev/v1"
    }
)

fastify.register(
    openapiGlue,
    {
        specification,
        service: new StagingService(),
        prefix: "staging/v1"
    }
)

fastify.register(
    openapiGlue,
    {
        specification,
        service: new ProdService(),
        prefix: "v1"
    }
)

fastify.listen(3000)
```

You might also want to check out the [fastify autoload plugin](https://github.com/fastify/fastify-autoload).







