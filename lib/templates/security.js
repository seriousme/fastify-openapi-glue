module.exports = data => {

  let securitySchemes;
  if (data.securitySchemes) {
    securitySchemes = Object.entries(data.securitySchemes);
  }
  else {
    securitySchemes = [];
  }

  return `// implementation of the security schemes in the openapi specification

class Security {
  constructor() {}

  async initialize(schemes){
    // schemes will contain securitySchemes as found in the openapi specification
    console.log("Initialize:", JSON.stringify(schemes));
  }

${securitySchemes
      .map(
        ([schemeKey, schemeVal]) => `
  // Security scheme: ${schemeKey}
  // Type: ${schemeVal.type}
  async ${schemeKey}(req, reply, params) {
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
