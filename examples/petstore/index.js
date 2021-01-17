// a fastify plugin do demo fastify-openapi-glue
// it can be run as plugin on any fastify server
// or standalone using "fastify start plugin.js"
import openapiGlue from "../../index.js";
import service from "./service.js"
const localFile = ( fileName ) => (new URL(fileName,import.meta.url)).pathname

const options = {
  specification: localFile('./petstore-openapi.v3.json'),
  service,
  prefix: 'v2'
};

export default async function (fastify, opts) {
  fastify.register(openapiGlue, options);
};
