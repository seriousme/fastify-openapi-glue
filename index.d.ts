declare module 'fastify-openapi-glue'
{
  import * as http from 'http';
  import * as http2 from 'http2';
  import * as fastify from 'fastify';

  namespace fastifyOpenapiGlue {
    interface FastifyOpenapiGlueOptions {
      specification: string;
      service: string | object | Function;
      securityHandlers: string | object | Function;
      prefix?: string;
      noAdditional?: boolean;
      ajvOptions: object;
    }
  }

  function fastifyOpenapiGlue<
    HttpServer extends (http.Server | http2.Http2Server),
    HttpRequest extends (http.IncomingMessage | http2.Http2ServerRequest),
    HttpResponse extends (http.ServerResponse | http2.Http2ServerResponse),
    OpenapiGlueOptions = fastifyOpenapiGlue.FastifyOpenapiGlueOptions
  >(
    fastify: fastify.FastifyInstance<HttpServer, HttpRequest, HttpResponse>,
    opts: OpenapiGlueOptions
  ): Promise<void>;

  export = fastifyOpenapiGlue;
}
