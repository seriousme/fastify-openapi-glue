const fp = require("fastify-plugin");
const url = require("url");
const Ajv = require("ajv").default;
const addFormats = require("ajv-formats");
const parser = require("./lib/parser");
const Security = require("./lib/securityHandlers");
const hasESM = Number(process.versions.node.split('.')[0]) >= 14;

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

async function getObject(param, name) {
  let data = param;
  if (typeof param === "string") {
    try {
      /* istanbul ignore next */
      data = hasESM ? (await import(url.pathToFileURL(param).href)).default : require(param);
    } catch (error) {
      throw new Error(`failed to load ${param}`);
    }
  }
  if (typeof data === "function") {
    data = data();
  }
  if (!isObject(data)) {
    throw new Error(`'${name}' parameter must refer to an object`);
  }
  return data;
}

async function getSecurityHandlers(opts, config) {
  let security;
  let securityHandlers;
  if (opts.securityHandlers) {
    securityHandlers = await getObject(opts.securityHandlers, 'securityHandlers');
    security = new Security(securityHandlers);
    if ("initialize" in securityHandlers) {
      securityHandlers.initialize(config.securitySchemes);
    }
  }
  return { securityHandlers, security };
}

function setValidatorCompiler(instance, ajvOpts, noAdditional) {
  let ajvOptions = {
    removeAdditional: !noAdditional,
    useDefaults: true,
    coerceTypes: true,
    strict: false,
  };
  Object.assign(ajvOptions, ajvOpts);
  const ajv = new Ajv(ajvOptions);
  // add default AJV formats
  addFormats(ajv);

  instance.setValidatorCompiler(({ schema, method, url, httpPart }) =>
    ajv.compile(schema)
  );

  instance.setSchemaErrorFormatter(
    (errors, dataVar) => new Error(ajv.errorsText(errors, { dataVar })),
  );
}

function checkParserValidators(instance, contentTypes) {
  contentTypes.forEach((contentType) => {
    if (!instance.hasContentTypeParser(contentType)) {
      instance.log.warn(`ContentTypeParser for '${contentType}' not found`);
    }
  });
}

function notImplemented(operationId) {
  return async (request, reply) => {
    throw new Error(`Operation ${operationId} not implemented`);
  };
}

// this is the main function for the plugin
async function fastifyOpenapiGlue(instance, opts) {
  setValidatorCompiler(instance, opts.ajvOptions, opts.noAdditional);
  
  const config = await parser().parse(opts.specification);
  checkParserValidators(instance, config.contentTypes);

  const service = await getObject(opts.service, "service");

  const { securityHandlers, security } = await getSecurityHandlers(
    opts,
    config,
  );

  async function generateRoutes(routesInstance, routesOpts) {
    config.routes.forEach((item) => {
      const response = item.schema.response;
      if (item.operationId in service) {
        routesInstance.log.debug(`service has '${item.operationId}'`);
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
            ", ",
          )
          }`,
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
  fastify: ">=3.2.1",
  name: "fastify-openapi-glue",
});

module.exports.options = {
  specification: "examples/petstore/petstore-swagger.v2.json",
  service: "examples/petstore/service.js",
};
