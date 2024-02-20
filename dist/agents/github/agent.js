import { c as coreExports, w as which_1, g as getExecOutput_1, a as cacheDir_1, f as find_1 } from './vendor.js';
import fs from 'node:fs';

class BuildAgent {
  get agentName() {
    return "GitHub Actions";
  }
  addPath(inputPath) {
    coreExports.addPath(inputPath);
  }
  debug(message) {
    coreExports.debug(message);
  }
  info(message) {
    coreExports.info(message);
  }
  warn(message) {
    coreExports.warning(message);
  }
  error(message) {
    coreExports.error(message);
  }
  async exec(exec, args) {
    const dotnetPath = await which_1(exec, true);
    const { exitCode, stdout, stderr } = await getExecOutput_1(`"${dotnetPath}"`, args);
    return {
      code: exitCode,
      error: null,
      stderr,
      stdout
    };
  }
  async cacheDir(sourceDir, tool, version, arch) {
    return cacheDir_1(sourceDir, tool, version, arch);
  }
  dirExists(file) {
    return fs.existsSync(file) && fs.statSync(file).isDirectory();
  }
  fileExists(file) {
    return fs.existsSync(file) && fs.statSync(file).isFile();
  }
  findLocalTool(toolName, versionSpec, arch) {
    return find_1(toolName, versionSpec, arch);
  }
  getSourceDir() {
    return this.getVariable("GITHUB_WORKSPACE");
  }
  getTempRootDir() {
    return this.getVariable("RUNNER_TEMP");
  }
  getCacheRootDir() {
    return this.getVariable("RUNNER_TOOL_CACHE");
  }
  getBooleanInput(input, required) {
    const inputValue = this.getInput(input, required);
    return (inputValue || "false").toLowerCase() === "true";
  }
  getInput(input, required) {
    return coreExports.getInput(input, { required })?.trim();
  }
  getListInput(input, required) {
    return this.getInput(input, required).split("\n").filter((x) => x !== "");
  }
  setFailed(message, _) {
    coreExports.setFailed(message);
  }
  setOutput(name, value) {
    coreExports.setOutput(name, value);
  }
  setSucceeded(_message, _done) {
  }
  getVariable(name) {
    return process.env[name] || "";
  }
  setVariable(name, value) {
    coreExports.exportVariable(name, value);
  }
  async which(tool, check) {
    return which_1(tool, check);
  }
}

export { BuildAgent };
//# sourceMappingURL=agent.js.map
