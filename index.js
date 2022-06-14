const fp = require("fastify-plugin");
const ip = require('ip');
const jwt = require('jsonwebtoken');
const parser = require("./lib/parser");
const jwksClient = require('jwks-rsa');

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

function getObject(param) {
  let data = param;
  if (typeof param === "string") {
    try {
      data = require(param);
    } catch (error) {
      throw new Error(`failed to load ${param}`);
    }
  }
  if (typeof data === "function") {
    data = data();
  }

  return data;
}

// fastify uses the built-in AJV instance during serialization, and that
// instance does not know about int32 and int64 so remove those formats
// from the responses
const unknownFormats = { int32: true, int64: true };

function stripResponseFormats(schema) {
  for (let item in schema) {
    if (isObject(schema[item])) {
      if (schema[item].format && unknownFormats[schema[item].format]) {
        schema[item].format = undefined;
      }
      stripResponseFormats(schema[item]);
    }
  }
}

async function fastifyOpenapiGlue(instance, opts) {
  const service = getObject(opts.service);
  if (!isObject(service)) {
    throw new Error("'service' parameter must refer to an object");
  }

  const config = await parser().parse(opts.specification);
  const routeConf = {};

  // AJV misses some validators for int32, int64 etc which ajv-oai adds
  const Ajv = require("ajv-oai");
  const ajv = new Ajv({
    // the fastify defaults
    removeAdditional: true,
    useDefaults: true,
    coerceTypes: true
  });

  instance.setValidatorCompiler(schema => ajv.compile(schema));

  if (config.prefix) {
    routeConf.prefix = config.prefix;
  }

  /**
   * @param request {request}
   * @param entity {string} name of object or field, used for error handling
   * @return {Promise.<void>}
   */
  async function checkJWT(request, entity) {
    if (!('authorization' in request.headers)) {
      const message = `Missing authorization header for ${entity}`;
      // await global.mq.openapiFailures(request, null, message);
      throw new Error(message);
    }
    const token = request.headers['authorization'].split(' ')[1];
    let payload;

    // check if the token is expired or broken
    try {
      if(typeof opts.jwks === 'object'){
        const getJwks = jwksClient({
            jwksUri: opts.jwks.Uri,
            requestHeaders: opts.jwks.requestHeaders, // Optional
            timeout: opts.jwks.timeout || 30000 // Defaults to 30s
          });
        const { header: { kid, alg }, payload: { iss } } =  jwt.decode(token, {complete: true});
        opts.publicKey = await getJwks.getSigningKey(kid).then(key => key.getPublicKey())
      }
      payload = jwt.verify(token, opts.publicKey, { algorithms: ['RS256'] });
    } catch (err) {
      const message = `${err.name} ${err.message} for ${entity}`;
      // await global.mq.openapiFailures(request, null, message);
      throw new Error(message);
    }

    const { IpList, Role } = payload;

    // check that client IP in token range
    if (IpList && IpList.length) {
      const ipInAllowedRange = IpList.some(ipRange => ip.cidrSubnet(ipRange).contains(request.req.ip));
      if (!ipInAllowedRange) {
        const message = 'IP address if out of range you permit for';
        // await global.mq.openapiFailures(request, payload, message);
        throw new Error(message);
      }
    }

    request.Roles = Role;
    request.EntityId = payload.EntityId || 'not provided';
    request.EntityType = payload.EntityType || 'not provided';

    // send requet message to the AMQP if everything's fine
    // if (global.mq) {
    //   global.mq.openapiRequests(request, payload);
    // }
  }

  async function checkAccess(request, item) {
    if (item.schema) {
      const schema = item.schema;
      // TODO extend rule for more x-auth-type
      const xAuthTypes = item.openapiSource['x-AuthType'];
      if (xAuthTypes.length && !xAuthTypes.some(el => el === "None")) {
        request.xAuthTypes = xAuthTypes;
        await checkJWT(request, schema.operationId);
      }
    }
  }

  async function generateRoutes(routesInstance, opt) {
    config.routes.forEach(item => {
      const response = item.schema.response;
      if (response) {
        stripResponseFormats(response);
      }
      if (service[item.operationId]) {
        const controllerName = item.operationId;
        routesInstance.log.debug("service has", controllerName);
        item.preValidation = async (request, reply, done) => {
          if (opts.metrics && opts.metrics[`${controllerName}${opts.metrics.suffix.total}`]) {
            opts.metrics[`${controllerName}${opts.metrics.suffix.total}`].mark();
          }
          request.controllerName = controllerName;
          try {
            if (opts.checkToken) await checkAccess(request, item);
          } catch (error) {
            if (error.message.split(' ').includes('expired')) {
              reply.code(440).send({ 'Status': 440, 'Description': `${error.message}` });
            }
            else {
              reply.code(401).send({ 'Status': 401, 'Description': `${error.message}` });
            }
          }
        };
        item.handler = async (request, reply) => {
          return service[item.operationId](request, reply);
        };
      } else {
        item.handler = async (request, reply) => {
          throw new Error(`Operation ${item.operationId} not implemented`);
        };
      }
      routesInstance.route(item);
    });
  }

  instance.register(generateRoutes, routeConf);
}

module.exports = fp(fastifyOpenapiGlue, {
  fastify: ">=0.39.0",
  name: "fastify-openapi-glue"
});

module.exports.options = {
  specification: "examples/petstore/petstore-swagger.v2.json",
  service: "examples/petstore/service.js"
};
