module.exports = data => {

    let securitySchemes;
    if (data.generic.securityDefinitions) {
        securitySchemes = Object.entries(data.generic.securityDefinitions);
    } else if (data.generic.components && data.generic.components.securitySchemes) {
        securitySchemes = Object.entries(data.generic.components.securitySchemes);
    } else {
        securitySchemes = [];
    }
    
    return `// implementation of the security schemes in the openapi specification

class Security {
  constructor() {}

${securitySchemes
  .map(
    ([schemeKey, schemeVal]) => `
  // Security scheme: ${schemeKey}
  // Type: ${schemeVal.type}
  async ${schemeKey}(req, reply) {
    console.log("${schemeKey}: Authenticating request");
    
    // If validation fails: throw new Error('Could not authenticate request')
    // Else, simply return.

    // The request object can also be mutated here (e.g. to set 'req.user')
  }`
  )
  .join("\n")}
}

module.exports = new Security();
`
};
