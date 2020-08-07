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

function setValidatorCompiler(instance, ajvOpts, noAdditional) {
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

function buildSecHandler(schemes, securityHandlers) {
  return async (req, reply) => {
    const handlerErrors = [];
    for (let scheme of schemes) {
      try {
        await securityHandlers[scheme](req, reply);
        return; // If one security check passes, no need to try any others
      } catch (err) {
        req.log.debug("Security check failed:", err, err.stack);
        handlerErrors.push(err);
      }
    }
    // if we get this far no security handlers validated this request
    const err = new Error(
      `None of the security schemes (${schemes.join(
        ", "
      )}) successfully authenticated this request.`
    );
    err.statusCode = 401;
    err.name = "Unauthorized";
    err.errors = handlerErrors;
    throw err;
  };
}

function getSecurityHandler(schemes, securityHandlers, handlerCache, missingHandlers) {
  const registeredSchemes = [];
  // Don't pollute memory with redundant functions
  const schemeKey = schemes.join(":");
  if (handlerCache[schemeKey]) {
    return handlerCache[schemeKey];
  }

  schemes.forEach((scheme) => {
    if (scheme in securityHandlers) {
      registeredSchemes.push(scheme);
    } else {
      missingHandlers.push(scheme);
    }
  });

  // This is a new handler, so build it once
  handlerCache[schemeKey] = buildSecHandler(registeredSchemes, securityHandlers);
  return handlerCache[schemeKey];
}

async function fastifyOpenapiGlue(instance, opts) {
  const service = await getObject(opts.service);
  if (!isObject(service)) {
    throw new Error("'service' parameter must refer to an object");
  }

  const config = await parser().parse(opts.specification);

  // AJV misses some validators for int32, int64 etc which ajv-oai adds
  setValidatorCompiler(instance, opts.ajvOptions, opts.noAdditional);

  checkParserValidators(instance, config.contentTypes);

  const routeConf = {};
  if (opts.prefix) {
    routeConf.prefix = opts.prefix;
  } else if (config.prefix) {
    routeConf.prefix = config.prefix;
  }

  let securityHandlers;
  if (opts.securityHandlers) {
    securityHandlers = await getObject(opts.securityHandlers);
    if (!isObject(securityHandlers)) {
      throw new Error("'securityHandlers' parameter must refer to an object");
    }
  }

  async function generateRoutes(routesInstance, routesOpts) {
    const securityHandlersCache = {};
    const missingSecurityHandlers = [];
    config.routes.forEach((item) => {
      const response = item.schema.response;
      if (response) {
        stripResponseFormats(response);
      }
      if (service[item.operationId]) {
        routesInstance.log.debug("service has", item.operationId);
        item.handler = service[item.operationId].bind(service);
      } else {
        item.handler = notImplemented(item.operationId);
      }

      // Apply security requirements if present and at least one handler is defined
      if (item.security && opts.securityHandlers) {
        item.preHandler = getSecurityHandler(
          item.security,
          securityHandlers,
          securityHandlersCache,
          missingSecurityHandlers
        ).bind(routesInstance);
      }

      routesInstance.route(item);
    });

    if (missingSecurityHandlers.length > 0) {
      routesInstance.log.warn(
        `Handlers for some security requirements were missing: ${missingSecurityHandlers.join(
          ", "
        )}`
      );
    }
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
