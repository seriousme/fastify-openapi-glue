import { expectTypeOf } from "expect-type";
import type {
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
	RouteOptions,
} from "fastify";
import type { FastifyOpenapiGlueOptions, SecurityError } from "./index.js";
import fastifyOpenapiGlue from "./index.js";

// Test plugin type
expectTypeOf(fastifyOpenapiGlue).toEqualTypeOf<
	FastifyPluginAsync<FastifyOpenapiGlueOptions>
>();

// Test minimal options
expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: {},
});

expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: "path/to/spec.json",
});

// Test all options
expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: "path/to/spec.json",
	serviceHandlers: {},
	service: {}, // deprecated but should still work
	securityHandlers: {},
	prefix: "v1",
	addEmptySchema: true,
	addCookieSchema: false,
});

// Test operation resolver returning handler function
const handlerResolver = (
	_operationId: string,
	_method: string,
	_path: string,
) => {
	return (_req: FastifyRequest, _res: FastifyReply) => {};
};

expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: {},
	operationResolver: handlerResolver,
});

// Test operation resolver returning RouteOptions
const routeOptionsResolver = (
	_operationId: string,
	_method: string,
	_path: string,
): RouteOptions => {
	return {
		method: "GET",
		url: "/test",
		handler: (_req, _res) => {},
	};
};

expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: {},
	operationResolver: routeOptionsResolver,
});

// Test SecurityError interface
const securityError: SecurityError = {
	statusCode: 401,
	name: "SecurityError",
	message: "Unauthorized",
	errors: [],
};

expectTypeOf(securityError).toEqualTypeOf<SecurityError>();
expectTypeOf(securityError).toExtend<Error>();
expectTypeOf(securityError.statusCode).toEqualTypeOf<number>();
expectTypeOf(securityError.name).toEqualTypeOf<string>();
expectTypeOf(securityError.errors).toEqualTypeOf<Array<Error>>();

// Test option types
expectTypeOf<FastifyOpenapiGlueOptions["specification"]>().toEqualTypeOf<
	object | string
>();
expectTypeOf<FastifyOpenapiGlueOptions["serviceHandlers"]>().toEqualTypeOf<
	object | undefined
>();
expectTypeOf<FastifyOpenapiGlueOptions["service"]>().toEqualTypeOf<
	object | undefined
>();
expectTypeOf<FastifyOpenapiGlueOptions["securityHandlers"]>().toEqualTypeOf<
	object | undefined
>();
expectTypeOf<FastifyOpenapiGlueOptions["prefix"]>().toEqualTypeOf<
	string | undefined
>();
expectTypeOf<FastifyOpenapiGlueOptions["addEmptySchema"]>().toEqualTypeOf<
	boolean | undefined
>();
expectTypeOf<FastifyOpenapiGlueOptions["addCookieSchema"]>().toEqualTypeOf<
	boolean | undefined
>();

// Test that serviceHandlers and operationResolver are mutually exclusive
expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: {},
	serviceHandlers: {},
	// operationResolver should not be used with serviceHandlers
});

expectTypeOf<FastifyOpenapiGlueOptions>({
	specification: {},
	operationResolver: handlerResolver,
	// serviceHandlers should not be used with operationResolver
});
