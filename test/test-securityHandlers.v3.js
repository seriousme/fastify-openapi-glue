const t = require("tap");
const test = t.test;
const Fastify = require("fastify");
const fastifyOpenapiGlue = require("../index");

const testSpec = require("./test-openapi.v3.json");
const petStoreSpec = require("./petstore-openapi.v3.json");
const securityHandlers = require('./security');
const serviceFile = `${__dirname}/service.js`;
const service = require(serviceFile);

const invalidSecurityOpts = {
  specification: testSpec,
  service,
  securityHandlers: () => { }
};

test("security handler registration succeeds", t => {
  const opts = {
    specification: petStoreSpec,
    service,
    securityHandlers
  };

  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.ready(err => {
    if (err) {
      console.log(err);
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("security preHandler throws error", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck
    }
  };

  t.plan(4);
  const fastify = Fastify();
  fastify.setErrorHandler((err, req, reply) => {
    t.strictEqual(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 401);
      t.strictEqual(res.statusMessage, 'Unauthorized');
    }
  );
});

test("security preHandler passes on succes", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
      skipped: securityHandlers.goodAuthCheck,
      failing: securityHandlers.failingAuthCheck
    }
  };

  t.plan(3);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);
  
  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 200);
      t.strictEqual(res.statusMessage, 'OK');
    }
  );
});

test("security preHandler passes with empty handler", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers
  };

  t.plan(3);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);
  
  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurityEmptyHandler",
    },
    (err, res) => {
      console.log("#####", err)
      t.error(err);
      t.strictEqual(res.statusCode, 200);
      t.strictEqual(res.statusMessage, 'OK');
    }
  );
});

test("security preHandler handles missing handlers", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      ipa_key: securityHandlers.failingAuthCheck
    }
  };

  t.plan(4);
  const fastify = Fastify();
  fastify.setErrorHandler((err, req, reply) => {
    t.strictEqual(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.strictEqual(res.statusCode, 401);
      t.strictEqual(res.statusMessage, 'Unauthorized');
    }
  );
});

test("invalid securityHandler definition throws error ", t => {
  t.plan(1);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, invalidSecurityOpts);
  fastify.ready(err => {
    if (err) {
      console.log("-->Error message", err.message)
      t.match(err.message, "'securityHandlers' parameter must refer to an object", "got expected error");
    } else {
      t.fail("missed expected error");
    }
  });
});
