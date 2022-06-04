/// <reference types="node" />

import { FastifyRegister } from "fastify";


export interface FastifyOpenapiGlueOptions {
  specification: object | string;
  service: string | object | Function;
  securityHandlers?: string | object | Function;
  prefix?: string;
  noAdditional?: boolean;
  defaultAJV?: boolean;
  ajvOptions?: object;
}


declare const FastifyOpenApiGlue: FastifyRegister<FastifyOpenapiGlueOptions>;

export default FastifyOpenApiGlue;
