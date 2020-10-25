const fp = require("fastify-plugin");
const parser = require("./lib/parser");
const Security = require("./lib/securityHandlers");
const hasESM = process.version.split(/[v|\./]/)[1] >= 14;

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

async function getObject(param) {
  let data = param;
  if (typeof param === "string") {
    try {
      /* istanbul ignore next */
      if (hasESM) {
        data = (await import(param)).default;
      }
      else {
        data = require(param);
      }
    } catch (error) {
      throw new Error(`failed to load ${param}`);
    }

  }
  if (typeof data === "function") {
    data = data();
  }

  return data;
}

function setValidatorCompiler(instance, ajvOpts, noAdditional) {
  // AJV misses some validators for int32, int64 etc which ajv-oai adds
  const Ajv = require("ajv-oai");
  let ajvOptions = {
    removeAdditional: !noAdditional,
    useDefaults: true,
    coerceTypes: true,
    nullable: true,
  };
  Object.assign(ajvOptions, ajvOpts);
  const ajv = new Ajv(ajvOptions);

  instance.setValidatorCompiler(({ schema, method, url, httpPart }) =>
    ajv.compile(schema)
  );
}

function checkParserValidators(instance, contentTypes) {
  // quick hack because of https://github.com/fastify/fastify/issues/2448
  const buildinTypes = new Set();
  buildinTypes.add("application/json");
  buildinTypes.add("text/plain");
  // end of hack
  contentTypes.forEach((contentType) => {
    if (
      !(
        buildinTypes.has(contentType) ||
        instance.hasContentTypeParser(contentType)
      )
    ) {
      instance.log.warn(`ContentTypeParser for '${contentType}' not found`);
    }
  });
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

function notImplemented(operationId) {
  return async (request, reply) => {
    throw new Error(`Operation ${operationId} not implemented`);
  };
}

async function fastifyOpenapiGlue(instance, opts) {
  setValidatorCompiler(instance, opts.ajvOptions, opts.noAdditional);

  const config = await parser().parse(opts.specification);
  checkParserValidators(instance, config.contentTypes);

  const service = await getObject(opts.service);
  if (!isObject(service)) {
    throw new Error("'service' parameter must refer to an object");
  }

  let security;
  let securityHandlers;
  if (opts.securityHandlers) {
    securityHandlers = await getObject(opts.securityHandlers);
    if (!isObject(securityHandlers)) {
      throw new Error("'securityHandlers' parameter must refer to an object");
    }
    security = new Security(securityHandlers);
    if ("initialize" in securityHandlers) {
      securityHandlers.initialize(config.securitySchemes);
    }
  }

  async function generateRoutes(routesInstance, routesOpts) {
    config.routes.forEach((item) => {
      const response = item.schema.response;
      if (response) {
        stripResponseFormats(response);
      }
      if (item.operationId in service) {
        routesInstance.log.debug("service has", item.operationId);
        item.handler = service[item.operationId].bind(service);
      } else {
        item.handler = notImplemented(item.operationId);
      }

      // Apply security requirements if present and at least one handler is defined
      if (security && security.has(item.security)) {
        item.preHandler = security.get(item.security).bind(securityHandlers);
      }
      routesInstance.route(item);
    });

    if (security) {
      const missingSecurityHandlers = security.getMissingHandlers();
      if (missingSecurityHandlers.length > 0) {
        routesInstance.log.warn(
          `Handlers for some security requirements were missing: ${missingSecurityHandlers.join(
            ", "
          )}`
        );
      }
    }
  }

  const routeConf = {};
  if (opts.prefix) {
    routeConf.prefix = opts.prefix;
  } else if (config.prefix) {
    routeConf.prefix = config.prefix;
  }

  instance.register(generateRoutes, routeConf);
}

module.exports = fp(fastifyOpenapiGlue, {
  fastify: ">=3.0.0",
  name: "fastify-openapi-glue",
});

module.exports.options = {
  specification: "examples/petstore/petstore-swagger.v2.json",
  service: "examples/petstore/service.js",
};
