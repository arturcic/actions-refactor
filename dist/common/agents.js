import * as process from 'node:process';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import { d as semver } from './semver.js';

class BuildAgentBase {
  get sourceDir() {
    return this.getVariableAsPath(this.sourceDirVariable);
  }
  get tempDir() {
    return this.getVariableAsPath(this.tempDirVariable);
  }
  get cacheDir() {
    return this.getVariableAsPath(this.cacheDirVariable);
  }
  getInput(input, required) {
    input = input.replace(/ /g, "_").toUpperCase();
    const val = this.getVariable(`INPUT_${input}`);
    if (required && !val) {
      throw new Error(`Input required and not supplied: ${input}`);
    }
    return val.trim();
  }
  getBooleanInput(input, required) {
    const inputValue = this.getInput(input, required);
    return (inputValue || "false").toLowerCase() === "true";
  }
  getListInput(input, required) {
    return this.getInput(input, required).split("\n").filter((x) => x !== "");
  }
  getVariable(name) {
    this.debug(`getVariable - ${name}`);
    const val = process.env[name] || "";
    return val.trim();
  }
  getVariableAsPath(name) {
    return path.resolve(path.normalize(this.getVariable(name)));
  }
  async dirExists(file) {
    try {
      await fs.access(file);
      return (await fs.stat(file)).isDirectory();
    } catch (e) {
      return false;
    }
  }
  async dirRemove(file) {
    await fs.rm(file, { recursive: true, force: true, maxRetries: 3, retryDelay: 1e3 });
  }
  async fileExists(file) {
    try {
      await fs.access(file);
      return (await fs.stat(file)).isFile();
    } catch (e) {
      return false;
    }
  }
  async cacheToolDir(sourceDir, tool, version, arch) {
    arch = arch || os.arch();
    if (!tool) {
      throw new Error("tool is a required parameter");
    }
    if (!version) {
      throw new Error("version is a required parameter");
    }
    if (!sourceDir) {
      throw new Error("sourceDir is a required parameter");
    }
    const cacheRoot = this.cacheDir;
    if (!cacheRoot) {
      this.debug("cache root not set");
      return "";
    }
    version = semver.clean(version) || version;
    const destPath = path.join(cacheRoot, tool, version, arch);
    if (await this.dirExists(destPath)) {
      this.debug(`Destination directory ${destPath} already exists, removing`);
      await fs.rm(destPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 1e3 });
    }
    this.debug(`Copying ${sourceDir} to ${destPath}`);
    await fs.mkdir(destPath, { recursive: true });
    await fs.cp(sourceDir, destPath, { recursive: true, force: true });
    this.debug(`Caching ${tool}@${version} (${arch}) from ${sourceDir}`);
    return destPath;
  }
  async findLocalTool(toolName, versionSpec, arch) {
    arch = arch || os.arch();
    if (!toolName) {
      throw new Error("toolName is a required parameter");
    }
    if (!versionSpec) {
      throw new Error("versionSpec is a required parameter");
    }
    const cacheRoot = this.cacheDir;
    if (!cacheRoot) {
      this.debug("cache root not set");
      return null;
    }
    versionSpec = semver.clean(versionSpec) || versionSpec;
    this.info(`Looking for local tool ${toolName}@${versionSpec} (${arch})`);
    const toolPath = path.join(cacheRoot, toolName, versionSpec, arch);
    if (!await this.dirExists(toolPath)) {
      this.info(`Directory ${toolPath} not found`);
      return null;
    } else {
      this.info(`Found tool ${toolName}@${versionSpec} (${arch}) at ${toolPath}`);
    }
    return toolPath;
  }
}

export { BuildAgentBase as B };
//# sourceMappingURL=agents.js.map
