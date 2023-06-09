import fp from "fastify-plugin";
import { Parser } from "./lib/Parser.js";
import Security from "./lib/securityHandlers.js";

function checkObject(obj, name) {
	if (typeof obj === "object" && obj !== null) {
		return;
	}
	throw new Error(`'${name}' parameter must refer to an object`);
}

function checkParserValidators(instance, contentTypes) {
	for (const contentType of contentTypes) {
		if (!instance.hasContentTypeParser(contentType)) {
			instance.log.warn(`ContentTypeParser for '${contentType}' not found`);
		}
	}
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

function createSecurityHandlers(instance, security, config) {
	for (const item of config.routes) {
		security.add(item.security);
	}
	const missingSecurityHandlers = security.getMissingHandlers();
	if (missingSecurityHandlers.length > 0) {
		instance.log.warn(
			`Handlers for some security requirements were missing: ${missingSecurityHandlers.join(
				", ",
			)}`,
		);
	}
}

async function getSecurity(instance, securityHandlers, config) {
	if (securityHandlers) {
		checkObject(securityHandlers, "securityHandlers");
		const security = new Security(securityHandlers);
		if ("initialize" in securityHandlers) {
			securityHandlers.initialize(config.securitySchemes);
		}
		createSecurityHandlers(instance, security, config);
		return security;
	}
	return undefined;
}

function getResolver(instance, service, operationResolver) {
	if (service && operationResolver) {
		throw new Error("'service' and 'operationResolver' are mutually exclusive");
	}

	if (!(service || operationResolver)) {
		throw new Error("either 'service' or 'operationResolver' are required");
	}

	if (operationResolver) {
		return operationResolver;
	}

	checkObject(service, "service");
	return defaultOperationResolver(instance, service);
}

// Apply service handler if present or else a notImplemented error
function serviceHandlerOptions(resolver, item) {
	const handler = resolver(item.operationId, item.method, item.openapiPath);

	const routeOptions =
		typeof handler === "function" ? { handler } : { ...handler };

	routeOptions.handler =
		routeOptions.handler || notImplemented(item.operationId);

	return routeOptions;
}

// Apply security requirements if present and at least one security handler is defined
function securityHandler(security, item) {
	if (security?.has(item.security)) {
		return security.get(item.security).bind(security.handlers);
	}
	return undefined;
}

function makeGenerateRoutes(config, resolver, security) {
	return async function generateRoutes(routesInstance) {
		for (const item of config.routes) {
			routesInstance.route({
				method: item.method,
				url: item.url,
				schema: item.schema,
				config: item.config,
				preHandler: securityHandler(security, item),
				...serviceHandlerOptions(resolver, item),
			});
		}
	};
}

// this is the main function for the plugin
async function plugin(instance, opts) {
	const parser = new Parser();
	const config = await parser.parse(opts.specification);
	checkParserValidators(instance, config.contentTypes);

	// use the provided operation resolver or default to looking in the service object
	const resolver = getResolver(instance, opts.service, opts.operationResolver);

	const security = await getSecurity(instance, opts.securityHandlers, config);

	const routeConf = {};
	if (opts.prefix) {
		routeConf.prefix = opts.prefix;
	} else if (config.prefix) {
		routeConf.prefix = config.prefix;
	}

	instance.register(makeGenerateRoutes(config, resolver, security), routeConf);
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
