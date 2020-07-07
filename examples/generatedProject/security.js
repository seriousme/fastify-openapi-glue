// implementation of the security schemes in the openapi specification

class Security {
  constructor() {}


  // Security scheme: petstore_auth
  // Type: oauth2
  async petstore_auth(req, reply) {
    console.log("petstore_auth: Authenticating request");
    
    // If validation fails: throw new Error('Could not authenticate request')
    // Else, simply return.

    // The request object can also be mutated here (e.g. to set 'req.user')
  }

  // Security scheme: api_key
  // Type: apiKey
  async api_key(req, reply) {
    console.log("api_key: Authenticating request");
    
    // If validation fails: throw new Error('Could not authenticate request')
    // Else, simply return.

    // The request object can also be mutated here (e.g. to set 'req.user')
  }
}

module.exports = new Security();
