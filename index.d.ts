/// <reference types="node" />

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";

type OperationResolver = (
	operationId: string,
	method: string,
	path: string,
) => (req: FastifyRequest, res: FastifyReply) => void;

export interface FastifyOpenapiGlueOptions {
	specification: object | string;
	service?: object;
	securityHandlers?: object;
	operationResolver?: OperationResolver;
	prefix?: string;
}

declare const fastifyOpenapiGlue: FastifyPluginAsync<FastifyOpenapiGlueOptions>;

export default fastifyOpenapiGlue;
export { fastifyOpenapiGlue };
