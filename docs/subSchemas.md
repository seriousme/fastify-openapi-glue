<h1 align="center">fastify-openapi-glue</h1>

## Using subschemas

Sometimes a specification is composed of multiple files that each contain parts
of the specification. The specification refers to these sub specifications using
`external references`. Since references are based on URI's (so `Identifier` and not
`Location` as in URL's!) there needs to be a way to resolve those as they are not automatically resolved. 

One way to integrate these subschemas into one single schema is by using [@seriousme/openapi-schema-validator](https://github.com/seriousme/openapi-schema-validator).

E.g.: we have a main specification in `main-spec.yaml` (JSON works too) containing:

```yaml
...
paths:
  /pet:
    post:
      tags:
        - pet
      summary: Add a new pet to the store
      description: ''
      operationId: addPet
      responses:
        '405':
          description: Invalid input
      requestBody:
        $ref: 'http://www.example.com/subspec#/components/requestBodies/Pet'
```

And the reference is in `sub-spec.yaml`, containing:

```yaml
components:
  requestBodies:
    Pet:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Pet'
        application/xml:
          schema:
            $ref: '#/components/schemas/Pet'
      description: Pet object that needs to be added to the store
      required: true
  ...
```

Then the schemas can be integrated as follows:

```javascript
import { Validator } from "@seriousme/openapi-schema-validator";
const validator = new Validator();
await validator.addSpecRef("./sub-spec.yaml", "http://www.example.com/subspec");
const res = await validator.validate("./main-spec.yaml");
// res now contains the results of the validation across main-spec and sub-spec
const specification = validator.specification;
// specification now contains a Javascript object containing the specification
// with the subspec inlined.
```

You can now feed the resulting `specification` to directly to `fastify-openapi-glue`.
