// baseclass for the v2 and v3 parsers

export const HttpOperations = new Set([
	"delete",
	"get",
	"head",
	"patch",
	"post",
	"put",
	"options",
]);

function escapeJsonPointer(str) {
	return str.replace(/~/g, "~0").replace(/\//g, "~1");
}

export class ParserBase {
	constructor() {
		this.config = { generic: {}, routes: [], contentTypes: new Set() };
	}

	makeOperationId(operation, path) {
		// make a nice camelCase operationID
		// e.g. get /user/{name}  becomes getUserByName
		const firstUpper = (str) => str.substr(0, 1).toUpperCase() + str.substr(1);
		const by = (_matched, p1) => `By${firstUpper(p1)}`;
		const parts = path.split("/").slice(1);
		parts.unshift(operation);
		const opId = parts
			.map((item, i) => (i > 0 ? firstUpper(item) : item))
			.join("")
			.replace(/{(\w+)}/g, by)
			.replace(/[^a-z]/gi, "");
		return opId;
	}

	makeURL(path) {
		// fastify wants 'path/:param' instead of openapis 'path/{param}'
		return path.replace(/{(\w+)}/g, ":$1");
	}

	processSchema(schemas, item) {
		// clone schema to avoid side effects
		const obj = structuredClone(schemas[item]);
		let refAdded = false;

		function inspectNode(obj, path, paths) {
			if (typeof obj === "object" && obj !== null) {
				if (paths.has(obj)) {
					return paths.get(obj);
				}
				const newPaths = new Map(paths);
				newPaths.set(obj, path);
				for (const [key, value] of Object.entries(obj)) {
					const $ref = inspectNode(
						value,
						`${path}/${escapeJsonPointer(key)}`,
						newPaths,
					);
					if (typeof $ref === "string") {
						obj[key] = { $ref };
						refAdded = true;
					}
				}
			}
			return undefined;
		}

		const paths = new Map();
		inspectNode(obj, "#", paths);
		// AJV requires an $id attribute for references to work
		if (refAdded && typeof obj["$id"] === "undefined") {
			obj["$id"] = "http://example.com/fastifySchema";
		}
		schemas[item] = obj;
	}

	removeRecursion(schemas) {
		for (const [key, subschema] of Object.entries(schemas)) {
			if (key === "response") {
				this.processResponseSchema(subschema);
			} else {
				// some schemas are in the form of "body->content->mimeType->schema"
				if (subschema.content) {
					for (const [_contentType, contentTypeObj] of Object.entries(
						subschema.content,
					)) {
						this.processSchema(contentTypeObj, "schema");
					}
				}
				// all others are in the form of "query->schema" etc
				else {
					this.processSchema(schemas, key);
				}
			}
		}
	}

	processOperation(path, operation, operationSpec, genericSchema) {
		if (operationSpec["x-no-fastify-config"]) {
			return;
		}
		const route = {
			method: operation.toUpperCase(),
			url: this.makeURL(path),
			schema: this.makeSchema(genericSchema, operationSpec),
			openapiPath: path,
			operationId:
				operationSpec.operationId || this.makeOperationId(operation, path),
			openapiSource: operationSpec,
			security: operationSpec.security || this.spec.security,
		};

		if (operationSpec["x-fastify-config"]) {
			route.config = operationSpec["x-fastify-config"];
		}

		this.config.routes.push(route);
	}

	processPaths(paths) {
		for (const [path, pathSpec] of Object.entries(paths)) {
			const { parameters, ...operations } = pathSpec;
			const genericSchema = {};

			if (typeof parameters === "object") {
				this.parseParameters(genericSchema, parameters);
			}

			for (const [operation, operationSpec] of Object.entries(operations)) {
				if (HttpOperations.has(operation)) {
					this.processOperation(path, operation, operationSpec, genericSchema);
				}
			}
		}
	}
}
