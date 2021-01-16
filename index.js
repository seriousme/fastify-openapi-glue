import fp from "fastify-plugin";
import { pathToFileURL } from "url";
import AJV from "ajv";
const Ajv= AJV.default;
import addFormats from "ajv-formats";
import oaiFormats from "./lib/oai-formats.js";
import { Parser } from "./lib/Parser.js";
import Security from "./lib/securityHandlers.js";

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

async function getObject(param, name) {
  let data = param;
  if (typeof param === "string") {
    try {
      /* istanbul ignore next */
      data = (await import(pathToFileURL(param).href)).default
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
    strict: false
  };
  Object.assign(ajvOptions, ajvOpts);
  const ajv = new Ajv(ajvOptions);
  // add default AJV formats
  addFormats(ajv);
  // ajv-formats misses some validators for byte, float, double, int32 and int64 that oai-formats adds
  for (const fmt in oaiFormats) {
    ajv.addFormat(fmt, oaiFormats[fmt]);
  }

  instance.setValidatorCompiler(({ schema, method, url, httpPart }) =>
    ajv.compile(schema)
  );
}

function checkParserValidators(instance, contentTypes) {
  contentTypes.forEach((contentType) => {
    if (!instance.hasContentTypeParser(contentType)) {
      instance.log.warn(`ContentTypeParser for '${contentType}' not found`);
    }
  });
}

// fastify uses the built-in AJV instance during serialization, and that
// instance does not know about int32, int64 etc so remove those formats
// from the responses

const unknownFormats = oaiFormats;

function stripResponseFormats(schema, visited = new Set()) {
  for (const item in schema) {
    if (isObject(schema[item])) {
      if (schema[item].format && unknownFormats[schema[item].format] !== undefined) {
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

// this is the main function for the plugin
async function fastifyOpenapiGlue(instance, opts) {
  setValidatorCompiler(instance, opts.ajvOptions, opts.noAdditional);
  const parser = new Parser();
  const config = await parser.parse(opts.specification);
  checkParserValidators(instance, config.contentTypes);

  const service = await getObject(opts.service, 'service');

  const { securityHandlers, security } = await getSecurityHandlers(opts, config);

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

export default fp(fastifyOpenapiGlue, {
  fastify: ">=3.2.1",
  name: "fastify-openapi-glue",
});

export const options = {
  specification: "examples/petstore/petstore-swagger.v2.json",
  service: "examples/petstore/service.js",
};
