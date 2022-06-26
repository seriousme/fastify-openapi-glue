// generator.js
// this could be extended to include examples mocks etc

import { mkdirSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { createHash } from "crypto";
import { Parser } from "./Parser.js";
import { createRequire } from "module";
const importJSON = createRequire(import.meta.url);
const localFile = (fileName) => new URL(fileName, import.meta.url).pathname;

const pluginPackage = await importJSON("../package.json");

async function importDefault(file) {
  return (await import(file)).default;
}

function makeDir(dir, dirMode) {
  try {
    mkdirSync(dir, dirMode);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

function pathLocal(from, file) {
  // on windows the double backslash needs escaping to ensure it correctly shows up in printing
  return join(relative(from, localFile("..")), file).replace(/\\/g, "/");
}

function calcHash(data) {
  const hash = createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
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

  generatePlugin(
    specFile,
    service,
    security,
    pluginPackageName = pluginPackage.name
  ) {
    return this.makePlugin({ specFile, service, security, pluginPackageName });
  }

  generatePackage(opts = {}) {
    function copyProps(target, source, key) {
      for (const item in source[key]) {
        target[key][item] = source[key][item];
      }
    }

    const spec = {};
    const info = this.config.generic.info;
    // name and desciption are mandatory in the spec
    spec.name = info.title
      .toLowerCase()
      .replace(/[^a-z0-9_]/, "")
      .substr(0, 214); //npm package name has maxlength of 214

    spec.description = info.description;

    this.newPkg.name = opts.name || spec.name;
    this.newPkg.description = opts.description || spec.description;

    // only include dependencies when not calculating checksums
    // to avoid issues with dependabot and the likes
    if (!this.checksumOnly) {
      copyProps(this.newPkg, pluginPackage, "dependencies");
      copyProps(this.newPkg, pluginPackage, "devDependencies");
    }

    if (!(this.localPlugin || this.checksumOnly)) {
      // add openapi-glue as dependency for the generated code
      this.newPkg.dependencies[
        pluginPackage.name
      ] = `^${pluginPackage.version}`;
    }
    return JSON.stringify(this.newPkg, null, 2);
  }

  async generateProject(dir, project) {
    this.generateService = await importDefault("./templates/service.js");
    this.makePlugin = await importDefault("./templates/index.js");
    this.generateSecurity = await importDefault("./templates/security.js");
    this.generateTest = await importDefault("./templates/test-plugin.js");
    this.generateReadme = await importDefault("./templates/README.md.js");
    this.instructions = await importDefault("./templates/instructions.js");
    this.newPkg = await importJSON("./templates/package.json");

    const contents = (dir, fileName, data) => {
      return {
        path: join(dir, fileName),
        data,
        fileName,
      };
    };

    const projectDir = join(dir, project);
    const testDir = join(projectDir, "test");
    const dirMode = 0o755;
    const fileOpts = {
      encoding: "utf8",
      mode: 0o644,
    };

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
      service: contents(
        projectDir,
        serviceFile,
        this.generateService(this.config)
      ),
      security: contents(
        projectDir,
        securityFile,
        this.generateSecurity(this.config)
      ),
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
        this.generateReadme(project, this.instructions())
      ),
      testPlugin: contents(
        testDir,
        "test-plugin.js",
        this.generateTest(
          Object.assign(this.config, { specFile, serviceFile, plugin })
        )
      ),
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
${this.instructions()}`;
  }
}
