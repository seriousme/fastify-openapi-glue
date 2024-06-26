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
}

declare const fastifyOpenapiGlue: FastifyPluginAsync<FastifyOpenapiGlueOptions>;

export default fastifyOpenapiGlue;
export { fastifyOpenapiGlue };
