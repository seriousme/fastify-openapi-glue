import { expectTypeOf } from "expect-type";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { FastifyOpenapiGlueOptions, SecurityError } from "./index.js";
import fastifyOpenapiGlue from "./index.js";

// Test plugin type
expectTypeOf<FastifyPluginAsync<FastifyOpenapiGlueOptions>>(fastifyOpenapiGlue);

// Test options interface
expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: {},
});

expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: "path/to/spec.json",
	serviceHandlers: {},
	securityHandlers: {},
	prefix: "v1",
	addEmptySchema: true,
	addCookieSchema: false,
});

// Test operation resolver type
const operationResolver = (
	_operationId: string,
	_method: string,
	_path: string,
) => {
	return (_req: FastifyRequest, _res: FastifyReply) => {};
};

expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: {},
	operationResolver,
});

// Test SecurityError type
const securityError: SecurityError = {
	statusCode: 401,
	name: "SecurityError",
	message: "Unauthorized",
	errors: [],
};

expectTypeOf<SecurityError>(securityError);
