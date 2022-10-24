import fp from "fastify-plugin";
import { Parser } from "./lib/Parser.js";
import Security from "./lib/securityHandlers.js";

function checkObject(obj, name) {
  if (typeof obj === "object" && obj !== null) {
    return;
  }
  throw new Error(`'${name}' parameter must refer to an object`);
}

async function getSecurityHandlers(securityHandlers, config) {
  if (securityHandlers) {
    checkObject(securityHandlers, "securityHandlers");
    const security = new Security(securityHandlers);
    if ("initialize" in securityHandlers) {
      securityHandlers.initialize(config.securitySchemes);
    }
    return { securityHandlers, security };
  }
  return {};
}

function checkParserValidators(instance, contentTypes) {
  contentTypes.forEach((contentType) => {
    if (!instance.hasContentTypeParser(contentType)) {
      instance.log.warn(`ContentTypeParser for '${contentType}' not found`);
    }
  });
}

function notImplemented(operationId) {
  return async () => {
    throw new Error(`Operation ${operationId} not implemented`);
  };
}

function defaultOperationResolver(routesInstance, service) {
  return function (operationId) {
    if (operationId in service) {
      routesInstance.log.debug(`service has '${operationId}'`);
      return service[operationId].bind(service);
    }
  };
}

function reportMissingSecurityHandlers(routesInstance, security) {
  const missingSecurityHandlers = security.getMissingHandlers();
  if (missingSecurityHandlers.length > 0) {
    routesInstance.log.warn(
      `Handlers for some security requirements were missing: ${missingSecurityHandlers.join(
        ", "
      )}`
    );
  }
}

// this is the main function for the plugin
async function plugin(instance, opts) {
  const parser = new Parser();
  const config = await parser.parse(opts.specification);
  checkParserValidators(instance, config.contentTypes);

  const service = opts.service;
  const operationResolver = opts.operationResolver;

  if (service && operationResolver) {
    throw new Error("'service' and 'operationResolver' are mutually exclusive");
  }

  if (!service && !operationResolver) {
    throw new Error("either 'service' or 'operationResolver' are required");
  }

  if (service) {
    checkObject(service, "service");
  }

  const { securityHandlers, security } = await getSecurityHandlers(
    opts.securityHandlers,
    config
  );

  async function generateRoutes(routesInstance) {
    // use the provided operation resolver or default to looking in the service
    const resolver =
      operationResolver || defaultOperationResolver(routesInstance, service);

    config.routes.forEach((item) => {
      const routeCfg = {
        method: item.method,
        url: item.url,
        schema: item.schema,
        config: item.config,
      };
      routeCfg.handler =
        resolver(item.operationId, item.method, item.openapiPath) ||
        notImplemented(item.operationId);
      // Apply security requirements if present and at least one handler is defined
      if (security?.has(item.security)) {
        routeCfg.preHandler = security
          .get(item.security)
          .bind(securityHandlers);
      }
      routesInstance.route(routeCfg);
    });

    if (security) {
      reportMissingSecurityHandlers(routesInstance, security);
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

const fastifyOpenapiGlue = fp(plugin, {
  fastify: ">=4.0.0",
  name: "fastify-openapi-glue",
});

export default fastifyOpenapiGlue;
export { fastifyOpenapiGlue };

export const options = {
  specification: "examples/petstore/petstore-swagger.v2.json",
  service: "examples/petstore/service.js",
};
