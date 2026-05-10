// a class for parsing openapi v3 data into config data for fastify

import { ParserBase } from "./ParserBase.js";

function isExploding(item) {
	const explode = !!(item.explode ?? item.style === "form");
	return explode !== false && item.schema?.type === "object";
}

export class ParserV3 extends ParserBase {
	processResponseSchema(schema) {
		// the response schema in fastify is in the form of
		// "response->200->content->application/json->schema"
		// it needs to be dereffed per HTTP mimetype
		for (const responseCode in schema) {
			const content = schema[responseCode].content;
			for (const contentType in content) {
				const contentTypeObj = content[contentType];
				this.processSchema(contentTypeObj, "schema");
			}
		}
	}

	parseQueryString(data) {
		if (data.length === 1) {
			if (typeof data[0].content === "object") {
				return this.parseContent(data[0], true);
			}
			if (isExploding(data[0])) {
				return data[0].schema;
			}
		}

		return this.parseParams(data);
	}

	parseParams(data) {
		const params = {
			type: "object",
			properties: {},
		};
		const required = [];

		for (const { name, schema, description, required: isRequired } of data) {
			// Use schema as a basis, only add description if it exists
			params.properties[name] = {
				...schema,
				...(description && { description }),
			};

			// track required props
			// ajv wants "required" to be an array, which seems to be too strict
			// see https://github.com/json-schema/json-schema/wiki/Properties-and-required
			if (isRequired) {
				required.push(name);
			}
		}

		if (required.length > 0) {
			params.required = required;
		}

		return params;
	}

	parseParameters(schema, data) {
		const grouped = {
			path: [],
			query: [],
			header: [],
			cookie: [],
		};

		const defaultStyles = {
			path: "simple",
			query: "form",
			header: "simple",
			cookie: "form",
		};

		for (const item of data) {
			const type = item.in;

			if (type === "cookie" && !this.options.addCookieSchema) {
				console.warn("cookie parameters are not supported by Fastify");
				continue;
			}

			if (grouped[type]) {
				item.style = item.style || defaultStyles[type];
				grouped[type].push(item);
			}
		}

		const config = [
			{ key: "params", list: grouped.path, parser: this.parseParams },
			{
				key: "querystring",
				list: grouped.query,
				parser: this.parseQueryString,
			},
			{ key: "headers", list: grouped.header, parser: this.parseParams },
			{ key: "cookies", list: grouped.cookie, parser: this.parseParams },
		];

		for (const { key, list, parser } of config) {
			if (list.length > 0) {
				schema[key] = parser.call(this, list);
			}
		}
	}

	parseContent(data, maxOne = false) {
		if (data?.content) {
			const result = { content: {} };
			const mimeTypes = Object.keys(data.content);
			if (mimeTypes.length === 0) {
				return undefined;
			}
			for (const mimeType of mimeTypes) {
				this.config.contentTypes.add(mimeType);
				if (data.content[mimeType].schema) {
					result.content[mimeType] = {};
					result.content[mimeType].schema = data.content[mimeType].schema;
				}
				if (maxOne) {
					return data.content[mimeType].schema;
				}
			}
			return result;
		}
		return undefined;
	}

	parseResponses(responses) {
		const result = {};
		for (const httpCode in responses) {
			const body = this.parseContent(responses[httpCode]);
			if (body !== undefined) {
				result[httpCode] = body;
				continue;
			}
			if (this.options.addEmptySchema) {
				result[httpCode] = {};
			}
		}
		return result;
	}

	makeSchema(genericSchema, data) {
		const {
			tags,
			summary,
			description,
			operationId,
			parameters,
			requestBody,
			responses,
			...rest // this includes x- props
		} = data;

		const schema = {
			...genericSchema,
			...(tags && { tags }),
			...(summary && { summary }),
			...(description && { description }),
			...(operationId && { operationId }),
		};

		// add x- extensions
		for (const [key, value] of Object.entries(rest)) {
			if (key.startsWith("x-")) {
				schema[key] = value;
			}
		}

		if (parameters) {
			this.parseParameters(schema, parameters);
		}

		const body = this.parseContent(requestBody);
		if (body) {
			schema.body = body;
		}

		// Process responses
		const response = this.parseResponses(responses);
		if (Object.keys(response).length > 0) {
			schema.response = response;
		}

		this.removeRecursion(schema);
		return schema;
	}

	parse(spec, options) {
		this.spec = spec;
		this.options = {
			addEmptySchema: options.addEmptySchema ?? false,
			addCookieSchema: options.addCookieSchema ?? false,
		};

		const { paths, components: { securitySchemes } = {}, ...generic } = spec;

		if (paths) this.processPaths(paths);
		if (securitySchemes) this.config.securitySchemes = securitySchemes;
		this.config.generic = generic;

		return this.config;
	}
}
