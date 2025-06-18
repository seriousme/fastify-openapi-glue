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

	copyProps(source, target, list, copyXprops = false) {
		// copy properties from source to target, if they are in the list
		for (const item in source) {
			if (list.includes(item) || (copyXprops && item.startsWith("x-"))) {
				target[item] = source[item];
			}
		}
	}

	removeRecursion(schemas) {
		function escapeJsonPointer(str) {
			return str.replace(/~/g, "~0").replace(/\//g, "~1");
		}

		function processSchema(obj) {
			let refAdded = false;

			function inspectNode(obj, path, paths) {
				if (typeof obj === "object" && obj !== null) {
					if (paths.has(obj)) {
						return paths.get(obj);
					}
					const newPaths = new Map(paths);
					newPaths.set(obj, path);
					for (const key in obj) {
						const $ref = inspectNode(
							obj[key],
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
		}

		for (const item in schemas) {
			const schema = schemas[item];
			// the response schema in fastify is in the form of "response->200->schema"
			// it needs to be dereffed per HTTP response code
			if (item === "response") {
				for (const responseCode in schema) {
					processSchema(schema[responseCode]);
				}
			} else {
				// some schemas are in the form of "body->content->mimeType->schema"
				if (schema.content) {
					for (const contentType in schema.content) {
						processSchema(schema.content[contentType].schema);
					}
				}
				// all others are in the form of "query->schema" etc
				else {
					processSchema(schema);
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
		const copyItems = ["summary", "description"];
		for (const path in paths) {
			const genericSchema = {};
			const pathSpec = paths[path];

			this.copyProps(pathSpec, genericSchema, copyItems, true);
			if (typeof pathSpec.parameters === "object") {
				this.parseParameters(genericSchema, pathSpec.parameters);
			}
			for (const operation in pathSpec) {
				if (HttpOperations.has(operation)) {
					this.processOperation(
						path,
						operation,
						pathSpec[operation],
						genericSchema,
					);
				}
			}
		}
	}
}
