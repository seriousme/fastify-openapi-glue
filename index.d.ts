/// <reference types="node" />

import type {
	FastifyPluginAsync,
	FastifyReply,
	FastifyRequest,
	RouteOptions,
} from "fastify";

type OperationResolver = (
	operationId: string,
	method: string,
	path: string,
) => ((req: FastifyRequest, res: FastifyReply) => void) | RouteOptions;

export interface FastifyOpenapiGlueOptions {
	specification: object | string;
	serviceHandlers?: object;
	/** @deprecated use serviceHandlers field instead */
	service?: object;
	securityHandlers?: object;
	operationResolver?: OperationResolver;
	prefix?: string;
	addEmptySchema?: boolean;
	/**
	 * NOTE:
	 *  This does not enable cookie validation (Fastify core does not support cookie validation).
	 *  This is simply a flag which triggers the addition of cookie schema (from the OpenAPI specification), into the 'schema' property of Fastify Routes options.
	 *  You can then hook Fastify's 'onRoute' event to make use of the schema as you wish.
	 */
	addCookieSchema?: boolean;
}

declare const fastifyOpenapiGlue: FastifyPluginAsync<FastifyOpenapiGlueOptions>;

export default fastifyOpenapiGlue;
export { fastifyOpenapiGlue };
