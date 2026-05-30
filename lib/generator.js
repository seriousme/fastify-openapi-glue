// generator.js

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pluginPackage from "../package.json" with { type: "json" };
import { Parser } from "./Parser.js";
import { templateInfo } from "./templates/templateTypes.js";

const contents = (dir, fileName, data) => {
	return {
		path: join(dir, fileName),
		data,
		fileName,
	};
};

function makeDir(dir, dirMode) {
	try {
		mkdirSync(dir, dirMode);
	} catch (error) {
		if (error.code !== "EEXIST") {
			throw error;
		}
	}
}

function calcHash(data) {
	const hash = createHash("sha256");
	hash.update(data);
	return hash.digest("hex");
}

async function getDataGenerator(type) {
	const path = templateInfo[type].path;
	const projectGenerator = `./templates/${path}/projectData.js`;
	const { generateProjectData } = await import(projectGenerator);
	return generateProjectData;
}

function copyDeps(newPkg, pluginPackage, depType) {
	for (const dep in newPkg[depType]) {
		newPkg[depType][dep] = pluginPackage[depType][dep];
	}
}

export class Generator {
	constructor(checksumOnly, localPlugin) {
		this.parser = new Parser();
		if (localPlugin) {
			this.localPlugin = true;
		}
		if (checksumOnly) {
			this.checksumOnly = true;
		}
	}

	async parse(specification) {
		this.config = await this.parser.parse(specification);
		this.specification = this.parser.specification();
		return this;
	}

	generatePackage(pkgTemplate) {
		const newPkg = structuredClone(pkgTemplate);

		const { title, description } = this.config.generic.info;

		newPkg.name = title
			.toLowerCase()
			.replace(/[^a-z0-9_]/g, "") // Regex verbeterd met 'g' flag voor alle tekens
			.substring(0, 214); // substring is de moderne variant van substr

		newPkg.description = description;

		// only include dependencies when not calculating checksums
		// to avoid issues with dependabot and the likes
		if (!this.checksumOnly) {
			copyDeps(newPkg, pluginPackage, "dependencies");
			copyDeps(newPkg, pluginPackage, "devDependencies");
		}

		if (!(this.localPlugin || this.checksumOnly)) {
			if (pkgTemplate.dependencies[pluginPackage.name] !== undefined) {
				// add openapi-glue as dependency for the generated code
				newPkg.dependencies[pluginPackage.name] = `^${pluginPackage.version}`;
			}
		}
		return JSON.stringify(newPkg, null, 2);
	}

	async generateProject(dir, project, type = "javascript") {
		const projectDir = join(dir, project);
		const testDir = join(projectDir, "test");
		const pluginPackageName = pluginPackage.name;

		const generateProjectData = await getDataGenerator(type);
		const { files, pkgTemplate, instructions } = generateProjectData({
			project,
			projectDir,
			testDir,
			config: this.config,
			specification: this.specification,
			pluginPackageName,
			localPlugin: this.localPlugin,
		});
		files.package = contents(
			projectDir,
			"package.json",
			this.generatePackage(pkgTemplate),
		);

		const dirMode = 0o755;
		const fileOpts = {
			mode: 0o644,
		};

		if (this.checksumOnly) {
			const results = {};
			for (const key in files) {
				const file = files[key];
				results[key] = {
					fileName: file.fileName,
					checksum: calcHash(file.data),
				};
			}
			return { files: results };
		}

		makeDir(projectDir, dirMode);
		makeDir(testDir, dirMode);

		for (const key in files) {
			const file = files[key];
			writeFileSync(file.path, file.data, fileOpts);
		}
		return `Your project has been generated in "${project}"
${instructions}`;
	}
}
