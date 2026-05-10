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
	processResponseSchema(schema) {
		// the response schema in fastify is in the form of "response->200->schema"
		// it needs to be dereffed per HTTP response code
		for (const responseCode in schema) {
			this.processSchema(schema, responseCode);
		}
	}

	parseParams(data) {
		const params = {
			type: "object",
			properties: {},
		};
		const required = [];

		for (const item of data) {
			//
			const { name, required: isRequired, ...rest } = item;

			// AJV requires special handling of "file" type
			if (rest.type === "file") {
				rest.type = "string";
				rest.isFile = true;
			}

			// only keep allowed schema props
			const targetProp = {};
			for (const prop of paramSchemaProps) {
				if (rest[prop] !== undefined) {
					targetProp[prop] = rest[prop];
				}
			}

			// add target props to schema
			params.properties[name] = targetProp;

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
		// group parameters based on the "in" property
		const grouped = {
			path: [],
			query: [],
			header: [],
			formData: [],
		};

		for (const item of data) {
			if (item.in === "body") {
				schema.body = item.schema;
				continue;
			}

			// add item to group if group exists
			if (grouped[item.in]) {
				grouped[item.in].push(item);
			}
		}

		// map the names to the destination schema
		const mappings = {
			params: grouped.path,
			querystring: grouped.query,
			headers: grouped.header,
			body: grouped.formData, // formdata and body should never be both present
		};

		// assign the groups to the schema
		for (const [key, list] of Object.entries(mappings)) {
			if (list.length > 0) {
				schema[key] = this.parseParams(list);
			}
		}
	}

	parseResponses(responses) {
		const result = {};
		for (const [httpCode, response] of Object.entries(responses)) {
			if (response.schema !== undefined) {
				result[httpCode] = response.schema;
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
			produces,
			consumes,
			deprecated,
			parameters,
			responses,
			...rest
		} = data;

		const schema = {
			...genericSchema,
			// Only add these items if defined
			...(tags && { tags }),
			...(summary && { summary }),
			...(description && { description }),
			...(operationId && { operationId }),
			...(produces && { produces }),
			...(consumes && { consumes }),
			...(deprecated !== undefined && { deprecated }),
		};

		for (const [key, value] of Object.entries(rest)) {
			if (key.startsWith("x-")) {
				schema[key] = value;
			}
		}
		if (parameters) {
			this.parseParameters(schema, parameters);
		}

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
		};

		const {
			paths,
			basePath: prefix,
			securityDefinitions: securitySchemes,
			...generic
		} = spec;

		if (paths) this.processPaths(paths);
		if (prefix) this.config.prefix = prefix;
		if (securitySchemes) this.config.securitySchemes = securitySchemes;

		this.config.generic = generic;
		return this.config;
	}
}
