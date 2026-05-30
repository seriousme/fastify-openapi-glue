// a fastify plugin to demo fastify-openapi-glue
// it can be run as plugin on any fastify server
// or standalone using "fastify start index.js --options"
import openapiGlue from "../../index.js";
import { Service } from "./service.js";

const serviceHandlers = new Service();

import path from "node:path";

const localFile = (fileName) => path.join(import.meta.dirname, fileName);

const pluginOptions = {
	specification: localFile("./petstore-openapi.v3.json"),
	serviceHandlers,
	prefix: "v2",
};

export default async function (fastify, _opts) {
	fastify.register(openapiGlue, pluginOptions);
}

export const options = {
	ajv: {
		customOptions: {
			strict: false,
		},
	},
};
