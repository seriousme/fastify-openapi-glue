// a fastify plugin to demo fastify-openapi-glue
// it can be run as plugin on any fastify server
// or standalone using "fastify start index.js"
import openapiGlue from "../../index.js";
import { Service } from "./service.js";
const serviceHandlers = new Service();
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const pluginOptions = {
	specification: localFile("./petstore-openapi.v3.json"),
	serviceHandlers,
	prefix: "v2",
};

export default async function (fastify, opts) {
	fastify.register(openapiGlue, pluginOptions);
}

export const options = {
	ajv: {
		customOptions: {
			strict: false,
		},
	},
};
