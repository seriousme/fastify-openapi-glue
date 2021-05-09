# Fastify OpenApi Glue
[![CI status](https://github.com/seriousme/fastify-openapi-glue/workflows/Node.js%20CI/badge.svg)](https://github.com/seriousme/fastify-openapi-glue/actions?query=workflow%3A%22Node.js+CI%22)
[![Coverage Status](https://coveralls.io/repos/github/seriousme/fastify-openapi-glue/badge.svg?branch=master)](https://coveralls.io/github/seriousme/fastify-openapi-glue?branch=master)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/seriousme/fastify-openapi-glue.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/seriousme/fastify-openapi-glue/context:javascript)
[![NPM version](https://img.shields.io/npm/v/fastify-openapi-glue.svg)](https://www.npmjs.com/package/fastify-openapi-glue)
![npm](https://img.shields.io/npm/dm/fastify-openapi-glue)



A plugin for [fastify](https://www.fastify.io) to autogenerate a configuration based on a [OpenApi](https://www.openapis.org/)(v2/v3) specification.

It aims at facilitating ["design first" API development](https://swagger.io/blog/api-design/design-first-or-code-first-api-development/) i.e. you write or obtain an API specification and use that to generate code. Given an OpenApi specification Fastify-openapi-glue handles the fastify configuration of routes and schemas etc. You can also [generate](#generator) your own project from a OpenApi specification.

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

All schema and routes will be taken from the OpenApi specification listed in the options. No need to specify them in your code. 
<a name="pluginOptions"></a>
### Options
  - `specification`: this can be a JSON object, or the name of a JSON or YAML file containing a valid OpenApi(v2/v3) file 
  - `service`: this can be a javascript object or class, or the name of a javascript file containing such an object. If the import of the file results in a function instead of an object then the function will be executed during import. 
  - `securityHandlers`: this can be a javascript object or class, or the name of a javascript file containing such an object. If the import of the file results in a function instead of an object then the function will be executed during import. See the [securityHandlers documentation](docs/securityHandlers.md) for more details.
  - `prefix`: this is a string that can be used to prefix the routes, it is passed verbatim to fastify. E.g. if the path to your operation is specified as "/operation" then a prefix of "v1" will make it available at "/v1/operation". This setting overrules any "basePath" setting in a v2 specification. See the [servers documentation](docs/servers.md) for more details on using prefix with a v3 specification.
  - `noAdditional`: by default Fastify will silently ignore additional properties in a message. Setting `noAdditional` to `true` will change this behaviour and will make Fastify return a HTTP error 400 when additional properties are present. Default value for this option is `false`.
  - `ajvOptions`: Pass additional options to AJV (see https://ajv.js.org/options.html)

`specification` and `service` are mandatory, `securityHandlers`, `prefix` and `noAdditional` are optional.

See the [examples](#examples) section for a demo.

Please be aware that `this` will refer to your service object or your securityHandler object and not to Fastify as explained in the [bindings documentation](docs/bindings.md)

<a name="generator"></a>
## Generator

To make life even more easy there is the `openapi-glue` cli. The `openapi-glue` cli takes a valid OpenApi (v2/v3) file (JSON or YAML) and generates a project including a fastify plugin that you can use on any fastify server, a stub of the service class and a skeleton of a test harness to test the plugin. 

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
  --projectName=<name>        [default: generatedProject]

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
routes extracted from the [petstore example](examples/petstore/petstore-openapi.v3.json) and the [accompanying service definition](examples/petstore/service.js)

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
The folder [examples/generatedProject](examples/generatedProject) contains the result of running `openapi-glue -l --baseDir=examples examples/petstore/petstore-swagger.v2.yaml`. The generated code can be started using `npm start` in `examples/generatedProject` (you will need to run `npm i` in the generated folder first)
<a name="Notes"></a>
## Notes
- the plugin ignores information in a v3 specification under `server/url` as there could be multiple values here, use the `prefix` [option](#pluginOptions) if you need to prefix your routes. See the [servers documentation](docs/servers.md) for more details.
- fastify only supports `application/json` and `text/plain` out of the box. The default charset is `utf-8`.  If you need to support different content types, you can use the fastify `addContentTypeParser` API.
- fastify only supports one schema per route. So while the v3 standard allows for multiple content types per route, each with their own schema this is currently not going to work with fastify. Potential workarounds include a custom content type parser and merging schemas upfront using JSON schema `oneOf`.
<a name="Fastify-swaggergen"></a>
## Fastify-swaggergen
Fastify-openapi-glue is the successor to the now deprecated [fastify-swaggergen](https://github.com/seriousme/fastify-swaggergen) project.
Main difference is that it: 
- aims to support OpenApi and not just Swagger V2 (hence the name change)
- does not include fastify-swagger support anymore. If you need to show the swagger UI you can include it yourself. Removing the swagger UI clears up a number of dependencies.
<a name="license"></a>
# License
Licensed under [MIT](LICENSE.txt)
