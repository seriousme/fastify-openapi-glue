const emptyScheme = Symbol("emptyScheme");

export class SecurityError extends Error {
	constructor(message, statusCode, name, errors) {
		super(message);
		this.statusCode = statusCode;
		this.name = name;
		this.errors = errors;
	}
}

export default class SecurityHandlers {
	/** constructor */
	constructor(handlers) {
		this.handlers = handlers;
		// the specificatio allows for an empty scheme that allows all access
		this.handlers[emptyScheme] = async () => {};
		this.handlerMap = new Map();
		this.missingHandlers = [];
	}

	add(schemes) {
		if (!(schemes?.length > 0)) {
			return false;
		}
		const mapKey = JSON.stringify(schemes);
		if (!this.handlerMap.has(mapKey)) {
			const processedSchemes = [];
			for (const scheme of schemes) {
				// parser returns undefined on empty scheme
				if (scheme.name === undefined) {
					scheme.name = emptyScheme;
				}
				if (!(scheme.name in this.handlers)) {
					this.handlers[scheme.name] = () => {
						throw `Missing handler for "${scheme.name}" validation`;
					};
					this.missingHandlers.push(scheme.name);
				}
				processedSchemes.push(scheme);
			}
			this.handlerMap.set(mapKey, this._buildHandler(processedSchemes));
		}
		return this.handlerMap.has(mapKey);
	}

	get(schemes) {
		const mapKey = JSON.stringify(schemes);
		return this.handlerMap.get(mapKey);
	}

	has(schemes) {
		const mapKey = JSON.stringify(schemes);
		return this.handlerMap.has(mapKey);
	}

	getMissingHandlers() {
		return this.missingHandlers;
	}

	_buildHandler(schemes) {
		const securityHandlers = this.handlers;
		return async (req, reply) => {
			const handlerErrors = [];
			const schemeList = [];
			let statusCode = 401;
			for (const scheme of schemes) {
				try {
					await securityHandlers[scheme.name](req, reply, scheme.parameters);
					return; // If one security check passes, no need to try any others
				} catch (err) {
					req.log.debug(`Security handler '${scheme.name}' failed: '${err}'`);
					handlerErrors.push(err);
					if (err.statusCode !== undefined) {
						statusCode = err.statusCode;
					}
				}
				schemeList.push(scheme.name);
			}
			// if we get this far no security handlers validated this request
			throw new SecurityError(
				`None of the security schemes (${schemeList.join(
					", ",
				)}) successfully authenticated this request.`,
				statusCode,
				"Unauthorized",
				handlerErrors,
			);
		};
	}
}
