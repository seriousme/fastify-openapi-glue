// a fastify plugin do demo fastify-openapi-glue
// it can be run as plugin on any fastify server
// or standalone using "fastify start plugin.js"
import openapiGlue from "../../index.js";
import { dirname } from "../../lib/dirname-esm.js";
const dir = dirname(import.meta);

const options = {
  specification: `${dir}/petstore-openapi.v3.json`,
  service: `${dir}/service.js`,
  prefix: 'v2'
};

export default async function (fastify, opts) {
  fastify.register(openapiGlue, options);
};
