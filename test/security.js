class Security {
    constructor() { }

    async goodAuthCheck(req, reply) {
        // Do nothing--auth check succeeds!
    }

    async failingAuthCheck(req, reply) {
        throw 'API key was invalid or not found';
    }

}

module.exports = new Security();
