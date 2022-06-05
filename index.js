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
    checkObject(securityHandlers, 'securityHandlers');
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
  return async (request, reply) => {
    throw new Error(`Operation ${operationId} not implemented`);
  };
}

// this is the main function for the plugin
async function fastifyOpenapiGlue(instance, opts) {
  const parser = new Parser();
  const config = await parser.parse(opts.specification);
  checkParserValidators(instance, config.contentTypes);

  const service = opts.service;
  checkObject(service, 'service');

  const { securityHandlers, security } = await getSecurityHandlers(
    opts.securityHandlers,
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
      if (security?.has(item.security)) {
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

export default fp(fastifyOpenapiGlue, {
  fastify: ">=3.2.1",
  name: "fastify-openapi-glue",
});

export const options = {
  specification: "examples/petstore/petstore-swagger.v2.json",
  service: "examples/petstore/service.js",
};
