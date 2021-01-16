import tap from "tap";
const test = tap.test;
import Fastify from "fastify";
import fastifyOpenapiGlue from "../index.js";
import { importJSON } from "../lib/importJSON-esm.js";
import { dirname } from "../lib/dirname-esm.js";
const dir = dirname(import.meta);

const testSpec = await importJSON(`${dir}/test-swagger.v2.json`);
const petStoreSpec = await importJSON(`${dir}/petstore-swagger.v2.json`);
import service from './service.js';
import securityHandlers from './security.js';

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
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("security registration succeeds, but preHandler throws error", t => {
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
    t.equal(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 401);
      t.equal(res.statusMessage, 'Unauthorized');
    }
  );
});

test("security preHandler passes with short-circuit", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.goodAuthCheck,
      failing: securityHandlers.failingAuthCheck
    }
  };

  t.plan(3);
  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(res.statusMessage, 'OK');
    }
  );
});

test("security preHandler handles multiple failures", t => {
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
      failing: securityHandlers.failingAuthCheck
    }
  };

  t.plan(4);
  const fastify = Fastify();
  fastify.setErrorHandler((err, req, reply) => {
    t.equal(err.errors.length, 3);
    reply.code(err.statusCode).send(err);
  });
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 401);
      t.equal(res.statusMessage, 'Unauthorized');
    }
  );
});

test("initalization of securityHandlers succeeds", t => {
  t.plan(2);

  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      initialize: (securitySchemes) => {
        const securitySchemeFromSpec = JSON.stringify(testSpec.securityDefinitions);
        t.equal(JSON.stringify(securitySchemes), securitySchemeFromSpec);
      }
    }
  };

  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);
  fastify.ready(err => {
    if (err) {
      t.fail("got unexpected error");
    } else {
      t.pass("no unexpected error");
    }
  });
});

test("security preHandler gets parameters passed", t => {
  t.plan(8);
  const opts = {
    specification: testSpec,
    service,
    securityHandlers: {
      api_key: securityHandlers.failingAuthCheck,
      skipped: (req, repl, param) => { req.scope = param[0] },
      failing: securityHandlers.failingAuthCheck
    }
  };

  const fastify = Fastify();
  fastify.register(fastifyOpenapiGlue, opts);

  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationSecurity",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(res.statusMessage, 'OK');
      t.equal(res.body, '{"response":"authentication succeeded!"}');
    }
  );

  fastify.inject(
    {
      method: "GET",
      url: "/v2/operationSecurityWithParameter",
    },
    (err, res) => {
      t.error(err);
      t.equal(res.statusCode, 200);
      t.equal(res.statusMessage, 'OK');
      t.equal(res.body, '{"response":"skipped"}');
    }
  );
});
