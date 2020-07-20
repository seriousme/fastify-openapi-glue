/// <reference types="node" />

import { FastifyPlugin } from "fastify";


export interface FastifyOpenapiGlueOptions {
  specification: object | string;
  service: string | object | Function;
  securityHandlers?: string | object | Function;
  prefix?: string;
  noAdditional?: boolean;
  ajvOptions?: object;
}


declare const FastifyOpenApiGlue: FastifyPlugin<FastifyOpenapiGlueOptions>;

export default FastifyOpenApiGlue;
