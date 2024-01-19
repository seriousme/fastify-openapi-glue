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
		this.handlerMap = new Map();
		this.missingHandlers = [];
	}

	add(schemes) {
		if (!(schemes?.length > 0)) {
			return false;
		}
		const mapKey = JSON.stringify(schemes);
		if (!this.handlerMap.has(mapKey)) {
			const processedSchemesList = [];
			for (const schemeList of schemes) {
				const processedSchemes = [];
				if (schemeList?.length > 0) {
					for (const scheme of schemeList) {
						if (!(scheme.name in this.handlers)) {
							this.handlers[scheme.name] = () => {
								throw `Missing handler for "${scheme.name}" validation`;
							};
							this.missingHandlers.push(scheme.name);
						}
						processedSchemes.push(scheme);
					}
				}
				processedSchemesList.push(processedSchemes);
			}
			this.handlerMap.set(mapKey, this._buildHandler(processedSchemesList));
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
			const schemeListDone = [];
			let statusCode = 401;
			for (const schemeList of schemes) {
				let scheme;
				const andList = [];
				try {
					for (scheme of schemeList) {
						andList.push(scheme.name);
						// all the handlers in a scheme list must succeed
						await securityHandlers[scheme.name](req, reply, scheme.parameters);
					}
					return; // If one list of schemes passes, no need to try any others
				} catch (err) {
					req.log.debug(`Security handler '${scheme.name}' failed: '${err}'`);
					handlerErrors.push(err);
					if (err.statusCode !== undefined) {
						statusCode = err.statusCode;
					}
				}
				schemeListDone.push(andList.toString());
			}
			// if we get this far no security handlers validated this request
			throw new SecurityError(
				`None of the security schemes (${schemeListDone.join(
					", ",
				)}) successfully authenticated this request.`,
				statusCode,
				"Unauthorized",
				handlerErrors,
			);
		};
	}
}
