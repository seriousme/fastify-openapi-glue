export default (data) =>
	`// Fastify plugin autogenerated by fastify-openapi-glue
import openapiGlue from "${data.pluginPackageName}";
import { Security } from "./${data.securityFile}";
import { Service } from "./${data.serviceFile}";

const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const pluginOptions = {
	specification: localFile("./${data.specFile}"),
	serviceHandlers: new Service(),
	securityHandlers: new Security(),
};

export default async function (fastify, opts) {
	fastify.register(openapiGlue, { ...pluginOptions, ...opts });
}

export const options = {
	ajv: {
		customOptions: {
			strict: false,
		},
	},
};
`;
