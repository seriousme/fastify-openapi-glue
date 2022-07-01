// generator.js

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { Parser } from "./Parser.js";
import { createRequire } from "module";

const importJSON = createRequire(import.meta.url);
const pluginPackage = await importJSON("../package.json");

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
    if (error.code !== "EEXIST") throw error;
  }
}

function calcHash(data) {
  const hash = createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

async function getDataGenerator(type) {
  let projectGenerator;
  if (type === "javascript") {
    projectGenerator = "./templates/js/projectData.js";
  }
  const { generateProjectData } = await import(projectGenerator);
  return generateProjectData;
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
    return this;
  }

  async parse(specification) {
    this.config = await this.parser.parse(specification);
    this.specification = this.parser.specification();
    return this;
  }

  generatePackage(newPkg) {
    function copyProps(target, source, key) {
      for (const item in source[key]) {
        target[key][item] = source[key][item];
      }
    }

    const info = this.config.generic.info;
    // name and desciption are mandatory in the spec
    newPkg.name = info.title
      .toLowerCase()
      .replace(/[^a-z0-9_]/, "")
      .substr(0, 214); //npm package name has maxlength of 214

    newPkg.description = info.description;

    // only include dependencies when not calculating checksums
    // to avoid issues with dependabot and the likes
    if (!this.checksumOnly) {
      copyProps(newPkg, pluginPackage, "dependencies");
      copyProps(newPkg, pluginPackage, "devDependencies");
    }

    if (!(this.localPlugin || this.checksumOnly)) {
      // add openapi-glue as dependency for the generated code
      newPkg.dependencies[pluginPackage.name] = `^${pluginPackage.version}`;
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
      this.generatePackage(pkgTemplate)
    );

    const dirMode = 0o755;
    const fileOpts = {
      encoding: "utf8",
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
