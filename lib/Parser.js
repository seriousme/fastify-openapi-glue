// this class is to bridge various parser versions
import { ParserV2 } from "./Parser.v2.js";
import { ParserV3 } from "./Parser.v3.js";

const supportedVersions = new Set(["2.0", "3.0", "3.1", "3.2"]);

/**
 * Lightweight version detection
 * @param {object} specification
 * @returns
 */
function getOpenApiVersion(specification) {
	for (const version of supportedVersions) {
		const specificationType = version === "2.0" ? "swagger" : "openapi";
		const prop = specification[specificationType];
		if (typeof prop === "string" && prop.startsWith(version)) {
			return version;
		}
	}
	return undefined;
}

export class Parser {
	/**
	 * get the original specification as object
	 * @returns {object}
	 */
	specification() {
		return this.original;
	}

	/**
	 * preprocess the specification without validation
	 * @param {object} specification  object containing an openapi specification, the object must already be derefenced
	 * @returns {object}
	 */
	preProcessSpecNoValidation(specification) {
		try {
			if (typeof specification !== "object") {
				throw Error(
					"Specification must be an object when using 'noValidate' option",
				);
			}
			const spec = structuredClone(specification);
			const version = getOpenApiVersion(spec);
			if (version) {
				this.original = spec;
				return {
					valid: true,
					version,
					spec,
				};
			}
			return { valid: false };
		} catch (e) {
			// eslint-disable-next-line
			console.log(e.message);
			return { valid: false };
		}
	}

	/**
	 * preprocess the specification
	 * @param {string|object} specification Filename of JSON/YAML file or object containing an openapi specification
	 * @returns {object}
	 */

	async preProcessSpec(specification) {
		// only import the validator if required
		const { Validator } = await import("@seriousme/openapi-schema-validator");
		const validator = new Validator();
		try {
			// clone the original specification as resolveRefs modifies the schema
			const spec = structuredClone(specification);
			const res = await validator.validate(spec);
			if (res.valid) {
				this.original = structuredClone(validator.specification);
				return {
					valid: true,
					version: validator.version,
					spec: validator.resolveRefs(),
				};
			}
			throw Error(JSON.stringify(res.errors, null, 2));
		} catch (e) {
			// eslint-disable-next-line
			console.log(e.message);
			return { valid: false };
		}
	}

	/**
	 * parse a openapi specification
	 * @param {string|object} specification Filename of JSON/YAML file or object containing an openapi specification
	 * @returns {object} fastify configuration information
	 */

	async parse(specification, options = {}) {
		const res = options.noValidation
			? this.preProcessSpecNoValidation(specification)
			: await this.preProcessSpec(specification);
		if (!(res.valid && supportedVersions.has(res.version))) {
			throw new Error(
				"'specification' parameter must contain a valid specification of a supported OpenApi version",
			);
		}

		if (res.version === "2.0") {
			const parserV2 = new ParserV2();
			return parserV2.parse(res.spec, options);
		}

		const parserV3 = new ParserV3();
		return parserV3.parse(res.spec, options);
	}
}
