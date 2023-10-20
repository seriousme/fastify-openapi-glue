// a class for parsing openapi V2 data into config data for fastify
import { ParserBase } from "./ParserBase.js";

const paramSchemaProps = [
	"type",
	"description",
	"format",
	"allowEmptyValue",
	"items",
	"collectionFormat",
	"default",
	"maximum",
	"exclusiveMaximum",
	"minimum",
	"exclusiveMinimum",
	"maxLength",
	"minLength",
	"pattern",
	"maxItems",
	"minItems",
	"uniqueItems",
	"enum",
	"multipleOf",
];

export class ParserV2 extends ParserBase {
	parseParams(data) {
		const params = {
			type: "object",
			properties: {},
		};
		const required = [];
		for (const item of data) {
			// item.type "file" breaks ajv, so treat is as a special here
			if (item.type === "file") {
				item.type = "string";
				item.isFile = true;
			}
			//
			params.properties[item.name] = {};
			this.copyProps(item, params.properties[item.name], paramSchemaProps);
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
		const formData = [];
		for (const item of data) {
			switch (item.in) {
				case "body": {
					schema.body = item.schema;
					break;
				}
				case "formData": {
					formData.push(item);
					break;
				}
				case "path": {
					params.push(item);
					break;
				}
				case "query": {
					querystring.push(item);
					break;
				}
				case "header": {
					headers.push(item);
					break;
				}
			}
		}
		if (params.length > 0) {
			schema.params = this.parseParams(params);
		}
		if (querystring.length > 0) {
			schema.querystring = this.parseParams(querystring);
		}
		if (headers.length > 0) {
			schema.headers = this.parseParams(headers);
		}
		if (formData.length > 0) {
			schema.body = this.parseParams(formData);
		}
	}

	parseResponses(responses) {
		const result = {};
		for (const httpCode in responses) {
			if (responses[httpCode].schema !== undefined) {
				result[httpCode] = responses[httpCode].schema;
			}
		}
		return result;
	}

	makeSchema(genericSchema, data) {
		const schema = Object.assign({}, genericSchema);
		const copyItems = [
			"tags",
			"summary",
			"description",
			"operationId",
			"produces",
			"consumes",
			"deprecated",
		];
		this.copyProps(data, schema, copyItems, true);
		if (data.parameters) {
			this.parseParameters(schema, data.parameters);
		}
		const response = this.parseResponses(data.responses);
		if (Object.keys(response).length > 0) {
			schema.response = response;
		}

		// remove loops from the schema so fastify wont break
		this.removeRecursion(schema);
		return schema;
	}

	parse(spec) {
		this.spec = spec;

		for (const item in spec) {
			switch (item) {
				case "paths": {
					this.processPaths(spec.paths);
					break;
				}
				case "basePath":
					this.config.prefix = spec[item];
					break;
				case "securityDefinitions":
					this.config.securitySchemes = spec[item];
					break;
				default:
					this.config.generic[item] = spec[item];
			}
		}
		return this.config;
	}
}
