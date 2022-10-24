/// <reference types="node" />

import { FastifyPluginAsync } from "fastify";

type OperationResolver = (
  operationId: string,
  method: string,
  path: string
) => (req: any, res: any) => void;

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
