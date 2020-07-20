/// <reference types="node" />

import { FastifyPlugin } from "fastify";

declare module "fastify-openapi-glue" {
  namespace fastifyOpenapiGlue {
    export interface FastifyOpenapiGlueOptions {
      specification: string;
      service: string | object | Function;
      securityHandlers?: string | object | Function;
      prefix?: string;
      noAdditional?: boolean;
      ajvOptions?: object;
    }
  }
}

declare const FastifyOpenApiGluePlugin: FastifyPlugin<fastifyOpenapiGlue.FastifyOpenapiGlueOptions>;

export default FastifyOpenApiGluePlugin;
