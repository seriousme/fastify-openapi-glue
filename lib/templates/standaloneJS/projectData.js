import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import generatePlugin from "./index.js";
import generateInstructions from "./instructions.js";
import generateReadme from "./README.md.js";
import generateSecurity from "./security.js";
// manifest.js for javascript generation
import generateService from "./service.js";
import generateTest from "./test-plugin.js";

const importJSON = createRequire(import.meta.url);
const pkgTemplate = await importJSON("./package.json");
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const contents = (dir, fileName, data) => {
	return {
		path: join(dir, fileName),
		data,
		fileName,
	};
};

function pathLocal(from, file) {
	// on windows the double backslash needs escaping to ensure it correctly shows up in printing
	return join(relative(from, localFile("..")), file).replace(/\\/g, "/");
}

export function generateProjectData(data) {
	const { project, projectDir, testDir, config, specification, localPlugin } =
		data;
	const specFile = "openApi.json";
	const serviceFile = "service.js";
	const securityFile = "security.js";
	const plugin = "index.js";
	const securityHandlers = "securityHandlers.js";
	const securityHandlersTemplate = readFileSync(
		localFile(`../../${securityHandlers}`),
	);
	const pluginPackageName = localPlugin
		? pathLocal(projectDir, plugin)
		: data.pluginPackageName;
	const instructions = generateInstructions();
	const files = {
		spec: contents(
			projectDir,
			specFile,
			JSON.stringify(specification, null, 2),
		),
		service: contents(projectDir, serviceFile, generateService(config)),
		security: contents(projectDir, securityFile, generateSecurity(config)),
		plugin: contents(
			projectDir,
			plugin,
			generatePlugin({
				specFile,
				serviceFile,
				securityFile,
				securityHandlers,
				pluginPackageName,
				config,
			}),
		),
		readme: contents(
			projectDir,
			"README.md",
			generateReadme(project, instructions),
		),
		securityHandlers: contents(
			projectDir,
			securityHandlers,
			securityHandlersTemplate,
		),
		testPlugin: contents(
			testDir,
			"test-plugin.js",
			generateTest(Object.assign(config, { specFile, serviceFile, plugin })),
		),
	};
	return { files, pkgTemplate, instructions };
}
