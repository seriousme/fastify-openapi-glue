// this class is to bridge various parser versions
import swaggerParser from "swagger-parser"; 
import { ParserV2 } from "./Parser.v2.js";
import { ParserV3 } from "./Parser.v3.js";

export class Parser {
  /** constructor */
  constructor() {
    return this;
  }

  /**
   * get the original specification as object
   * @returns {object}
   */
  specification() {
    return this.original;
  }

  /**
   * parse a openapi specification
   * @param {string|object} specification Filename of JSON/YAML file or object containing an openapi specification
   * @returns {object} fastify configuration information
   */
  async parse(specification) {
    let spec, data;
    try {
      // parse first, to avoid dereferencing of $ref's
      data = await swaggerParser.parse(specification);
      // save the original (with $refs) because swp.validate modifies its input
      this.original = JSON.parse(JSON.stringify(data, null, 2));
      // and validate
      spec = await swaggerParser.validate(data);
    } catch (e) {
      // eslint-disable-next-line
      console.log(e.message);
      spec = {};
    }

    if (spec.swagger && spec.swagger.indexOf("2.0") === 0) {
      const parserV2 = new ParserV2();
      return parserV2.parse(spec);
    } else if (spec.openapi && spec.openapi.indexOf("3.0") === 0) {
      const parserV3 = new ParserV3();
      return parserV3.parse(spec);
    } else {
      throw new Error(
        "'specification' parameter must contain a valid version 2.0 or 3.0.x specification"
      );
    }
  }
}

