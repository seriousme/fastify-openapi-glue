const fp = require("fastify-plugin");
const parser = require("./lib/parser");

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

function getObject(param) {
  let data = param;
  if (typeof param === "string") {
    try {
      data = require(param);
    } catch (error) {
      throw new Error(`failed to load ${param}`);
    }
  }
  if (typeof data === "function") {
    data = data();
  }

  return Promise.resolve(data);
}

// fastify uses the built-in AJV instance during serialization, and that
// instance does not know about int32 and int64 so remove those formats
// from the responses
const unknownFormats = { int32: true, int64: true };

function stripResponseFormats(schema, visited = new Set()) {
  for (const item in schema) {
    if (isObject(schema[item])) {
      if (schema[item].format && unknownFormats[schema[item].format]) {
        schema[item].format = undefined;
      }
      if (!visited.has(item)) {
        visited.add(item);
        stripResponseFormats(schema[item], visited);
      }
    }
  }
}

async function fastifyOpenapiGlue(instance, opts) {
  const service = await getObject(opts.service);
  if (!isObject(service)) {
    throw new Error("'service' parameter must refer to an object");
  }

  const config = await parser().parse(opts.specification);
  const routeConf = {};

  // AJV misses some validators for int32, int64 etc which ajv-oai adds
  const Ajv = require("ajv-oai");
  let ajvOptions = {  // the fastify defaults
    removeAdditional: !opts.noAdditional,
    useDefaults: true,
    coerceTypes: true,
    nullable: true
  }
  Object.assign(ajvOptions, opts.ajvOptions)
  const ajv = new Ajv(ajvOptions);

  instance.setValidatorCompiler(({ schema, method, url, httpPart }) =>
    ajv.compile(schema)
  );

  if (opts.prefix) {
    routeConf.prefix = opts.prefix;
  } else if (config.prefix) {
    routeConf.prefix = config.prefix;
  }


  // quick hack because of https://github.com/fastify/fastify/issues/2448
  const buildinTypes = new Set();
  buildinTypes.add('application/json');
  buildinTypes.add('text/plain');
  // end of hack

  config.contentTypes.forEach(contentType => {
    if (!(buildinTypes.has(contentType) || instance.hasContentTypeParser(contentType))) {
      instance.log.warn(`ContentTypeParser for '${contentType}' not found`);
    }
  });



  let generatedSecurityHandlers = {};
  let missingSecurityHandlers = [];
  function getSecurityHandler(schemes) {
    // Don't pollute memory with redundant functions
    let schemeKey = schemes.join(':');
    if (generatedSecurityHandlers[schemeKey]) {
      return generatedSecurityHandlers[schemeKey];
    }

    // Ignore missing security handlers (we'll warn later on)
    let localMissingSecurityHandlers = schemes.filter(scheme => !Object.keys(opts.securityHandlers).find(name => name === scheme));
    missingSecurityHandlers = missingSecurityHandlers.concat(missingSecurityHandlers, localMissingSecurityHandlers);

    // Only check registered schemes
    schemes = schemes.filter(scheme => Object.keys(opts.securityHandlers).find(name => name === scheme));

    // This is a new handler, so build it once
    let secHandler = async (req, reply) => {
      let numSchemes = schemes.length;
      let numChecks = 0;
      for (let scheme of schemes) {
        numChecks++;

        try {
          await opts.securityHandlers[scheme](req, reply);
          return; // If one security check passes, no need to try any others
        } catch (err) {
          req.log.debug('Security check failed:', err, err.stack);

          // Only throw if no security handlers validated this request
          if (numChecks === numSchemes) {
            let err = new Error(`None of the security schemes (${schemes.join(', ')}) successfully authenticated this request.`);
            err.statusCode = 401;
            err.name = 'Unauthorized';
            throw err;
          }
        }
      }
    }

    generatedSecurityHandlers[schemeKey] = secHandler;

    return secHandler;
  }

  async function generateRoutes(routesInstance, routesOpts) {
    config.routes.forEach(item => {
      const response = item.schema.response;
      if (response) {
        stripResponseFormats(response);
      }
      if (service[item.operationId]) {
        routesInstance.log.debug("service has", item.operationId);
        item.handler = service[item.operationId].bind(service);
      } else {
        item.handler = async (request, reply) => {
          throw new Error(`Operation ${item.operationId} not implemented`);
        };
      }

      // Apply security requirements if present and at least one handler is defined
      if (item.security && opts.securityHandlers) {
        item.preHandler = getSecurityHandler.apply(routesInstance, [item.security]);
      }

      routesInstance.route(item);
    });

    if (missingSecurityHandlers.length > 0) {
      routesInstance.log.warn(`Handlers for some security requirements were missing: ${missingSecurityHandlers.join(', ')}`);
    }
  }

  instance.register(generateRoutes, routeConf);
}

module.exports = fp(fastifyOpenapiGlue, {
  fastify: ">=3.0.0",
  name: "fastify-openapi-glue"
});

module.exports.options = {
  specification: "examples/petstore/petstore-swagger.v2.json",
  service: "examples/petstore/service.js"
};
