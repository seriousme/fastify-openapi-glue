const emptyScheme = Symbol("emptyScheme");

module.exports = class Security {
  /** constructor */
  constructor(handlers) {
    this.handlers = handlers;
    // the specificatio allows for an empty scheme that allows all access
    this.handlers[emptyScheme] = async () => {};
    this.handlerMap = new Map();
    this.missingHandlers = [];
    return this;
  }

  has(schemes) {
    if (!schemes) {
      return false;
    }
    const mapKey = JSON.stringify(schemes);
    if (!this.handlerMap.has(mapKey)) {
      const processedSchemes = [];
      schemes.forEach((scheme) => {
        // parser returns undefined on empty scheme
        if (scheme === undefined) {
          scheme = emptyScheme;
        }
        if (!(scheme in this.handlers)) {
          this.handlers[scheme] = () => {
            throw `Missing handler for "${scheme}" validation`;
          };
          this.missingHandlers.push(scheme);
        }
        processedSchemes.push(scheme);
      });
      this.handlerMap.set(mapKey, this._buildHandler(processedSchemes));
    }
    return this.handlerMap.has(mapKey);
  }

  get(schemes) {
    const mapKey = JSON.stringify(schemes);
    return this.handlerMap.get(mapKey);
  }

  getMissingHandlers() {
    return this.missingHandlers;
  }

  _buildHandler(schemes) {
    const securityHandlers = this.handlers;
    return async (req, reply) => {
      const handlerErrors = [];
      for (const scheme of schemes) {
        try {
          await securityHandlers[scheme](req, reply);
          return; // If one security check passes, no need to try any others
        } catch (err) {
          req.log.debug("Security check failed:", err, err.stack);
          handlerErrors.push(err);
        }
      }
      // if we get this far no security handlers validated this request
      const err = new Error(
        `None of the security schemes (${schemes.join(
          ", "
        )}) successfully authenticated this request.`
      );
      err.statusCode = 401;
      err.name = "Unauthorized";
      err.errors = handlerErrors;
      throw err;
    };
  }
};
