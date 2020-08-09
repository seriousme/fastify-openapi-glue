// a fastify plugin do demo fastify-openapi-glue
// it can be run as plugin on any fastify server
// or standalone using "fastify start plugin.js"
const openapiGlue = require("../../index.js");

const options = {
  specification: `${__dirname}/petstore-openapi.v3.json`,
  service: `${__dirname}/service.js`,
  prefix: 'v2'
};

module.exports = async function (fastify, opts) {
  fastify.register(openapiGlue, options);
};
