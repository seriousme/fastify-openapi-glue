# Fastify OpenApi Glue
[![CI status](https://github.com/seriousme/fastify-openapi-glue/workflows/Node.js%20CI/badge.svg)](https://github.com/seriousme/fastify-openapi-glue/actions?query=workflow%3A%22Node.js+CI%22)
[![Coverage Status](https://coveralls.io/repos/github/seriousme/fastify-openapi-glue/badge.svg?branch=master)](https://coveralls.io/github/seriousme/fastify-openapi-glue?branch=master)
[![NPM version](https://img.shields.io/npm/v/fastify-openapi-glue.svg)](https://www.npmjs.com/package/fastify-openapi-glue)
![npm](https://img.shields.io/npm/dm/fastify-openapi-glue)



A plugin for [fastify](https://fastify.dev) to autogenerate a configuration based on a [OpenApi](https://www.openapis.org/)(v2/v3) specification.

It aims at facilitating ["design first" API development](https://swagger.io/blog/api-design/design-first-or-code-first-api-development/) i.e. you write or obtain an API specification and use that to generate code. Given an OpenApi specification Fastify-openapi-glue handles the fastify configuration of routes and validation schemas etc. You can also [generate](#generator) your own project from a OpenApi specification.

<a name="upgrading"></a>
## Upgrading

If you are upgrading from a previous major version of `fastify-openapi-glue` then please check out [UPGRADING.md](UPGRADING.md).

<a name="install"></a>
## Install 
```
npm i fastify-openapi-glue --save
```
<a name="plugin"></a>
## Plugin
<a name="pluginUsage"></a>
### Usage

Add the plugin to your project with `register` and pass it some basic options and you are done !
```javascript
import openapiGlue from "fastify-openapi-glue";
import { Service } from "./service.js";
import { Security } from "./security.js";

const options = {
  specification: `${currentDir}/petstore-openapi.v3.json`,
  serviceHandlers: new Service(),
  securityHandlers: new Security(),
  prefix: "v1",
};


fastify.register(openapiGlue, options);
```

All schema and routes will be taken from the OpenApi specification listed in the options. No need to specify them in your code. 
<a name="pluginOptions"></a>
### Options
  - `specification`: this can be a JSON object, or the name of a JSON or YAML file containing a valid OpenApi(v2/v3) file 
  - `serviceHandlers`: this can be a javascript object or class instance. See the [serviceHandlers documentation](docs/serviceHandlers.md) for more details.
  - `securityHandlers`: this can be a javascript object or class instance. See the [securityHandlers documentation](docs/securityHandlers.md) for more details.
  - `prefix`: this is a string that can be used to prefix the routes, it is passed verbatim to fastify. E.g. if the path to your operation is specified as "/operation" then a prefix of "v1" will make it available at "/v1/operation". This setting overrules any "basePath" setting in a v2 specification. See the [servers documentation](docs/servers.md) for more details on using prefix with a v3 specification.
 - `operationResolver`: a custom operation resolver function, `(operationId, method, openapiPath) => handler | routeOptions` where method is the uppercase HTTP method (e.g. "GET") and openapiPath is the path taken from the specification without prefix (e.g. "/operation"). Mutually exclusive with `serviceHandlers`. See the [operationResolver documentation](docs/operationResolver.md) for more details.
 - `addEmptySchema`: a boolean that allows empty bodies schemas to be passed through. This might be useful for status codes like 204 or 304. Default is `false`.

`specification` and either `serviceHandlers` or `operationResolver` are mandatory, `securityHandlers` and `prefix` are optional.
See the [examples](#examples) section for a demo.

Please be aware that `this` will refer to your serviceHandlers object or your securityHandler object and not to Fastify as explained in the [bindings documentation](docs/bindings.md)

<a name="pluginApiExtensions"></a>
### OpenAPI extensions
The OpenAPI specification supports [extending an API spec](https://spec.openapis.org/oas/latest.html#specification-extensions) to describe extra functionality that isn't covered by the official specification. Extensions start with `x-` (e.g., `x-myapp-logo`) and can contain a primitive, an array, an object, or `null`.

The following extensions are provided by the plugin:
- `x-fastify-config` (object): any properties will be added to the `routeOptions.config` property of the Fastify route.

  For example, if you wanted to use the fastify-raw-body plugin to compute a checksum of the request body, you could add the following extension to your OpenAPI spec to signal the plugin to specially handle this route:

  ```yaml
  paths:
    /webhooks:
      post:
        operationId: processWebhook
        x-fastify-config:
          rawBody: true
        responses:
          204:
            description: Webhook processed successfully
  ```

- `x-no-fastify-config` (true): this will ignore this specific route as if it was not present in your OpenAPI specification:

```yaml
  paths:
    /webhooks:
      post:
        operationId: processWebhook
        x-no-fastify-config: true
        responses:
          204:
            description: Webhook processed successfully
  ```

You can also set custom OpenAPI extensions (e.g., `x-myapp-foo`) for use within your app's implementation. These properties are passed through unmodified to the Fastify route on `{req,reply}.routeOptions.config`. Extensions specified on a schema are also accessible (e.g., `routeOptions.schema.body` or `routeOptions.schema.responses[<statusCode>]`).

<a name="generator"></a>
## Generator

To make life even more easy there is the `openapi-glue` cli. The `openapi-glue` cli takes a valid OpenApi (v2/v3) file (JSON or YAML) and generates a project including a fastify plugin that you can use on any fastify server, a stub of the serviceHandlers class and a skeleton of a test harness to test the plugin. 

<a name="generatorUsage"></a>
### Usage
```
  openapi-glue [options] <OpenApi specification>
```
or if you don't have `openapi-glue` installed:
```
  npx github:seriousme/fastify-openapi-glue <OpenApi specification>
```
This will generate a project based on the provided OpenApi specification.
Any existing files in the project folder will be overwritten!
See the [generator examples](#examples) section for a demo.
<a name="generatorOptions"></a>
### Options
```

  -p <name>                   The name of the project to generate
  --projectName=<name>        [default: generated-javascript-project]

  -b <dir> --baseDir=<dir>    Directory to generate the project in.
                              This directory must already exist.
                              [default: "."]

The following options are only usefull for testing the openapi-glue plugin:
  -c --checksumOnly           Don't generate the project on disk but
                              return checksums only.
  -l --localPlugin            Use a local path to the plugin.
```
See the [generator example](#generatorExamples) section for a demo.


<a name="examples"></a>
## Examples
Clone this repository and run `npm i` 

<a name="pluginExamples"></a>
### Plugin
Executing `npm start` will start fastify on localhost port 3000 with the
routes extracted from the [petstore example](examples/petstore/petstore-openapi.v3.json) and the [accompanying serviceHandlers definition](examples/petstore/service.js)

* http://localhost:3000/v2/pet/24 will return a pet as specified in service.js
* http://localhost:3000/v2/pet/myPet will return a fastify validation error:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "params.petId should be integer"
}
```

* http://localhost:3000/v2/pet/findByStatus?status=available&status=pending will return
  the following error:

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Operation findPetsByStatus not implemented"
}
```

* http://localhost:3000/v2/pet/0 will return the following error:

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message":"\"name\" is required!"
}
```

as the pet returned by service.js does not match the response schema.

<a name="generatorExamples"></a>
### Generator
The folder [examples/generated-javascript-project](examples/generated-javascript-project) contains the result of running `openapi-glue -l --baseDir=examples examples/petstore/petstore-swagger.v2.yaml`. The generated code can be started using `npm start` in `examples/generated-javascript-project` (you will need to run `npm i` in the generated folder first)
<a name="Notes"></a>
## Notes
- the plugin ignores information in a v3 specification under `server/url` as there could be multiple values here, use the `prefix` [option](#pluginOptions) if you need to prefix your routes. See the [servers documentation](docs/servers.md) for more details.
- fastify only supports `application/json` and `text/plain` out of the box. The default charset is `utf-8`.  If you need to support different content types, you can use the fastify `addContentTypeParser` API.
- fastify will by default coerce types, e.g when you expect a number a string like `"1"` will also pass validation, this can be reconfigured, see [Validation and Serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/).
- the plugin aims to follow fastify and does not compensate for features that are possible according to the OpenApi specification but not possible in standard fastify (without plugins). This will keep the plugin lightweigth and maintainable. E.g. Fastify does not support cookie validation, while OpenApi v3 does.
- in some cases however, the plugin may be able to provide you with data which could be used to enhance OpenApi support within your own Fastify application. Here is one possible way to perform [cookie validation](docs/cookieValidationHowTo.md)  yourself.
- if you have special needs on querystring handling (e.g. arrays, objects etc) then fastify supports a [custom querystring parser](https://fastify.dev/docs/latest/Reference/Server/#querystringparser). You might need to pass the AJV option `coerceTypes: 'array'` as an option to Fastify.
- the plugin is an ECMAscript Module (aka ESM). If you are using Typescript then make sure that you have read: https://www.typescriptlang.org/docs/handbook/esm-node.html to avoid any confusion.
- If you want to use a specification that consists of multiple files then please check out the page on [subschemas](docs/subSchemas.md) 
- Fastify uses AJV strict mode in validating schemas. If you get an error like `....due to error strict mode: unknown keyword: "..."` then please check out the page on [AJV strict mode](docs/AJVstrictMode.md) 
- Fastify does not support `multipart/form-data` out of the box. If you want to use it then have a look at: [@fastify/multipart](https://github.com/fastify/fastify-multipart).
- Fastify uses AJV with JSON schema draft-07 out of the box. If you want to use JSON schema draft-2020-12 features in your OpenApi 3.1+ schema then have a look at [using JSONschema 2020](docs/schema2020.md) 

<a name="Contributing"></a>
## Contributing
- contributions are always welcome. 
- if you plan on submitting new features then please create an issue first to discuss and avoid disappointments.
- main development is done on the master branch therefore PRs to that branch are preferred.
- please make sure you have run `npm test` before you submit a PR.
<a name="Fastify-swaggergen"></a>
## Fastify-swaggergen
Fastify-openapi-glue is the successor to the now deprecated [fastify-swaggergen](https://github.com/seriousme/fastify-swaggergen) project.
Main difference is that it: 
- aims to support OpenApi and not just Swagger V2 (hence the name change)
- does not include fastify-swagger support anymore. If you need to show the swagger UI you can include it yourself. Removing the swagger UI clears up a number of dependencies.
<a name="license"></a>
# License
Licensed under [MIT](LICENSE.txt)
