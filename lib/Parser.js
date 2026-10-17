// this class is to bridge various parser versions
import { Validator } from "@seriousme/openapi-schema-validator";
import { ParserV2 } from "./Parser.v2.js";
import { ParserV3 } from "./Parser.v3.js";

// Parses of a specification object, by the options they were made with. Registering the
// plugin again with the same document (a test that builds an app for each test does, every
// time) would otherwise validate and dereference the whole document again. Each caller gets
// its own copy, as Fastify and route hooks may change the route schemas they are handed. A
// document changed after its first parse would read stale, so pass a fresh object instead.
const parses = new WeakMap();

export class Parser {
	/**
	 * get the original specification as object
	 * @returns {object}
	 */
	specification() {
		return this.original;
	}

	async preProcessSpec(specification) {
		const validator = new Validator();
		try {
			// clone the original specification as resolveRefs modifies the schema
			const spec = structuredClone(specification);
			const res = await validator.validate(spec);
			if (res.valid) {
				this.original = JSON.parse(
					JSON.stringify(validator.specification, null, 2),
				);
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
		if (typeof specification !== "object" || specification === null) {
			return this.parseOnce(specification, options);
		}
		let byOptions = parses.get(specification);
		if (!byOptions) {
			byOptions = new Map();
			parses.set(specification, byOptions);
		}
		const key = JSON.stringify(options);
		if (!byOptions.has(key)) {
			const parser = new Parser();
			byOptions.set(
				key,
				parser
					.parseOnce(specification, options)
					.then((config) => ({ config, original: parser.original })),
			);
		}
		const { config, original } = await byOptions.get(key);
		this.original = structuredClone(original);
		return structuredClone(config);
	}

	async parseOnce(specification, options = {}) {
		const supportedVersions = new Set(["2.0", "3.0", "3.1", "3.2"]);

		const res = await this.preProcessSpec(specification);
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
