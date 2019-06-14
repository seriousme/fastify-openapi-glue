# Fastify OpenApi Glue
[![Build Status](https://travis-ci.org/seriousme/fastify-openapi-glue.svg?branch=master)](https://travis-ci.org/seriousme/fastify-openapi-glue)
[![Greenkeeper badge](https://badges.greenkeeper.io/seriousme/fastify-openapi-glue.svg)](https://greenkeeper.io/)

A plugin for [fastify](https://www.fastify.io) to autogenerate a configuration based on a [OpenApi](https://www.openapis.org/)(v2/v3) specification.

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
const openapiGlue = require("fastify-openapi-glue");

const options = {
  specification: `${__dirname}/petstore-swagger.v2.json`,
  service: `${__dirname}/service.js`,
  prefix: "v1"
};


fastify.register(openapiGlue, options);
```

All schema and routes will be taken from the OpenApi specification listed in the options. No need to specify them in your code. 
<a name="pluginOptions"></a>
### Options
  - `specification`: this can be a JSON object, or the name of a JSON or YAML file containing a valid OpenApi(v2/v3) file 
  - `service`: this can be a javascript object or class, or the name of a javascript file containing such an object. If the import of the file results in a function instead of an object then the function will be executed during import.
  - `prefix`: this is a string that can be used to prefix the routes, it is passed verbatim to fastify. E.g. if the path to your operation is specified as "/operation" then a prefix of "v1" will make it available at "/v1/operation". This setting overrules any "basePath" setting in a v2 specification. 

`specification` and `service` are mandatory, `prefix` is optional.

See the [examples](#examples) section for a demo.
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
routes extracted from the [petstore example](examples/petstore/petstore-swagger.v2.json) and the [accompanying service definition](examples/petstore/service.js)

* http://localhost:3000/v2/pet/24 will return a pet as specified in service.js
* http://localhost:3000/v2/pet/myPet will return a fastify validation error:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "params.petId should be integer"
}
```

* http://localhost:3000/v2/pet/findByStatus?status=a&status=b will return
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
  "message": "name is required!"
}
```

as the pet returned by service.js does not match the response schema.

<a name="generatorExamples"></a>
### Generator
The folder [examples/generatedProject](examples/generatedProject) contains the result of running `openapi-glue -l --baseDir=examples examples/petstore/petstore-swagger.v2.yaml`. The generated code can be started using `npm start` in `examples/generatedProject` (you will need to run `npm i` in the generated folder first)
<a name="Notes"></a>
## Notes
- the plugin ignores information in a v3 specification under `server/url` as there could be multiple values here, use the `prefix` [option](#pluginOptions) if you need to prefix your routes.
- the plugin ignores `securitySchemes` in a v3 specification as fastify has no built-in support for securitySchemes. You can add custom verification logic to your services or use additional fastify plugins to implement securitySchemes yourself.
<a name="Fastify-swaggergen"></a>
## Fastify-swaggergen
Fastify-openapi-glue is the successor to the now deprecated [fastify-swaggergen](https://github.com/seriousme/fastify-swaggergen) project.
Main difference is that it: 
- aims to support OpenApi and not just Swagger V2 (hence the name change)
- does not include fastify-swagger support anymore. If you need to show the swagger UI you can include it yourself. Removing the swagger UI clears up a number of dependencies.
<a name="license"></a>
# License
Licensed under [MIT](license.txt)
