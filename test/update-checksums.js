import { templateTypes } from "../lib/templates/templateTypes.js";
import { fileURLToPath, URL } from "url";
import { execSync } from "child_process";
const specs = new Set(["./test-swagger.v2", "./test-swagger-noBasePath.v2"]);
const cli = localFile("../bin/openapi-glue-cli.js");

function localFile(fileName) {
	return fileURLToPath(new URL(fileName, import.meta.url));
}

for (const type of templateTypes) {
	for (const spec of specs) {
		const specFile = localFile(`${spec}.json`);
		const checksumFile = localFile(`${spec}.${type}.checksums.json`);
		const project = `generated-${type}-project`;
		execSync(
			`node ${cli} -c -t ${type} -p ${project} ${specFile} > ${checksumFile}`,
		);
	}
}
