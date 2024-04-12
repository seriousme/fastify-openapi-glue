// a class for parsing openapi v3 data into config data for fastify

import { ParserBase } from "./ParserBase.js";

function isExploding(item) {
	const explode = item.explode ?? item.style === "form" ? true : false;
	return explode !== false && item.schema?.type === "object";
}

export class ParserV3 extends ParserBase {
	parseQueryString(data) {
		if (data.length === 1 && isExploding(data[0])) {
			return data[0].schema;
		}
		return this.parseParams(data);
	}

	parseParams(data) {
		const params = {
			type: "object",
			properties: {},
		};
		const required = [];
		for (const item of data) {
			params.properties[item.name] = item.schema;
			this.copyProps(item, params.properties[item.name], ["description"]);
			// ajv wants "required" to be an array, which seems to be too strict
			// see https://github.com/json-schema/json-schema/wiki/Properties-and-required
			if (item.required) {
				required.push(item.name);
			}
		}
		if (required.length > 0) {
			params.required = required;
		}
		return params;
	}

	parseParameters(schema, data) {
		const params = [];
		const querystring = [];
		const headers = [];
		// const formData = [];
		for (const item of data) {
			switch (item.in) {
				// case "body":
				//   schema.body = item.schema;
				//   break;
				// case "formData":
				//   formData.push(item);
				//   break;
				case "path": {
					item.style = item.style || "simple";
					params.push(item);
					break;
				}
				case "query": {
					item.style = item.style || "form";
					querystring.push(item);
					break;
				}
				case "header": {
					item.style = item.style || "simple";
					headers.push(item);
					break;
				}
				case "cookie": {
					console.warn("cookie parameters are not supported by Fastify");
					break;
				}
			}
		}
		if (params.length > 0) {
			schema.params = this.parseParams(params);
		}
		if (querystring.length > 0) {
			schema.querystring = this.parseQueryString(querystring);
		}
		if (headers.length > 0) {
			schema.headers = this.parseParams(headers);
		}
	}

	parseBody(data) {
		if (data?.content) {
			const mimeTypes = Object.keys(data.content);
			if (mimeTypes.length === 0) {
				return undefined;
			}
			for (const mimeType of mimeTypes) {
				this.config.contentTypes.add(mimeType);
			}
			// fastify only supports one mimeType per path, pick the last
			return data.content[mimeTypes.pop()].schema;
		}
		return undefined;
	}

	parseResponses(responses) {
		const result = {};
		for (const httpCode in responses) {
			const body = this.parseBody(responses[httpCode]);
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
		const schema = Object.assign({}, genericSchema);
		const copyItems = ["tags", "summary", "description", "operationId"];
		this.copyProps(data, schema, copyItems, true);
		if (data.parameters) {
			this.parseParameters(schema, data.parameters);
		}
		const body = this.parseBody(data.requestBody);
		if (body) {
			schema.body = body;
		}
		const response = this.parseResponses(data.responses);
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
		};

		for (const item in spec) {
			switch (item) {
				case "paths": {
					this.processPaths(spec.paths);
					break;
				}
				case "components":
					if (spec.components.securitySchemes) {
						this.config.securitySchemes = spec.components.securitySchemes;
					}
					break;
				default:
					this.config.generic[item] = spec[item];
			}
		}
		return this.config;
	}
}
