// generator.js
// this could be extended to include examples mocks etc

import { mkdirSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { createHash } from "crypto";
import { Parser } from "./Parser.js";
import { createRequire } from 'module';
const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => (new URL(fileName, import.meta.url)).pathname

import makeService from "./templates/service.js";
import makePlugin from "./templates/index.js";
import makeSecurity from "./templates/security.js";
import makeTest from "./templates/test-plugin.js";
import makeReadme from "./templates/README.md.js";
import instructions from "./templates/instructions.js";

const pluginPackage = await importJSON("../package.json");
const newPkg = await importJSON("./templates/package.json");

function makeDir(dir, dirMode) {
  try {
    mkdirSync(dir, dirMode);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

function pathLocal(from, file) {
  // on windows the double backslash needs escaping to ensure it correctly shows up in printing
  return join(relative(from, localFile("..")), file)
    .replace(/\\/g, "/");
}

class generator {
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

  generateService() {
    return makeService(this.config);
  }

  generateSecurity() {
    return makeSecurity(this.config);
  }

  generatePlugin(specFile, service, security, pluginPackageName) {
    pluginPackageName = pluginPackageName || pluginPackage.name;

    return makePlugin({ specFile, service, security, pluginPackageName });
  }

  generatePackage(opts = {}) {
    const copyProps = (target, source, key) => {
      Object.keys(target[key]).forEach(
        item => (target[key][item] = source[key][item])
      );
    };

    const spec = {};
    const info = this.config.generic.info;
    // name and desciption are mandatory in the spec
    spec.name = info.title
      .toLowerCase()
      .replace(/[^a-z0-9_]/, "")
      .substr(0, 214); //npm package name has maxlength of 214

    spec.description = info.description;

    newPkg.name = opts.name || spec.name;
    newPkg.description = opts.description || spec.description;

    // only include dependencies when not calculating checksums
    // to avoid issues with greenkeeper and the likes
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

  generateTest(specFile, service, plugin) {
    return makeTest(Object.assign(this.config, { specFile, service, plugin }));
  }

  generateReadme(project, instructions) {
    return makeReadme(project, instructions);
  }

  generateProject(dir, project) {

    const contents = (dir, fileName, data) => {
      return {
        path: join(dir, fileName),
        data,
        fileName
      };
    };

    const projectDir = join(dir, project);
    const testDir = join(projectDir, "test");
    const dirMode = 0o755;

    const specFile = "openApi.json";
    const serviceFile = "service.js";
    const securityFile = "security.js";
    const plugin = "index.js";
    const files = {
      spec: contents(
        projectDir,
        specFile,
        JSON.stringify(this.specification, null, 2)
      ),
      service: contents(projectDir, serviceFile, this.generateService()),
      security: contents(projectDir, securityFile, this.generateSecurity()),
      plugin: contents(
        projectDir,
        plugin,
        this.generatePlugin(
          specFile,
          serviceFile,
          securityFile,
          this.localPlugin ? pathLocal(projectDir, plugin) : undefined
        )
      ),
      package: contents(projectDir, "package.json", this.generatePackage()),
      readme: contents(
        projectDir,
        "README.md",
        this.generateReadme(project, instructions())
      ),
      testPlugin: contents(
        testDir,
        "test-plugin.js",
        this.generateTest(specFile, serviceFile, plugin)
      )
    };

    const fileOpts = {
      encoding: "utf8",
      mode: 0o644
    };

    this.generated = { files: {} };
    if (!this.checksumOnly) {
      this.generated.dirs = [];
      makeDir(projectDir, dirMode);
      this.generated.dirs.push(projectDir);
      makeDir(testDir, dirMode);
      this.generated.dirs.push(testDir);
    }

    for (const key of Object.keys(files)) {
      const file = files[key];
      const hash = createHash("sha256");
      hash.update(file.data);
      this.generated.files[key] = {
        fileName: file.fileName,
        checksum: hash.digest("hex")
      };
      if (!this.checksumOnly) {
        this.generated.files[key].path = file.path;
        writeFileSync(file.path, file.data, fileOpts);
      }
    }

    if (this.checksumOnly) {
      return this.generated;
    }
    return `Your project has been generated in "${project}"
${instructions(project)}`;
  }
}

export default generator;
