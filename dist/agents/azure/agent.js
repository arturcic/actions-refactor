import { p as prependPath_1, t as task, c as cacheDir_1, f as findLocalTool_1 } from './vendor.js';
import 'os';
import 'fs';
import 'path';
import 'events';
import 'assert';
import 'util';
import 'child_process';
import 'stream';
import 'crypto';
import '../vendor.js';
import 'url';
import 'http';
import 'https';
import 'zlib';
import 'net';
import 'tls';
import 'process';

class BuildAgent {
  get agentName() {
    return "Azure Pipelines";
  }
  addPath(inputPath) {
    prependPath_1(inputPath);
  }
  debug(message) {
    task.debug(message);
  }
  info(message) {
    task.debug(message);
  }
  warn(message) {
    task.warning(message);
  }
  error(message) {
    task.error(message);
  }
  async exec(exec, args) {
    const tr = task.tool(exec);
    tr.arg(args);
    const result = tr.execSync();
    return Promise.resolve({
      code: result.code,
      error: result.error,
      stderr: result.stderr,
      stdout: result.stdout
    });
  }
  async cacheDir(sourceDir, tool, version, arch) {
    return cacheDir_1(sourceDir, tool, version, arch);
  }
  dirExists(file) {
    return task.exist(file) && task.stats(file).isDirectory();
  }
  fileExists(file) {
    return task.exist(file) && task.stats(file).isFile();
  }
  findLocalTool(toolName, versionSpec, arch) {
    return findLocalTool_1(toolName, versionSpec, arch);
  }
  getSourceDir() {
    return this.getVariable("Build.SourcesDirectory");
  }
  getTempRootDir() {
    return this.getVariable("Agent.TempDirectory");
  }
  getCacheRootDir() {
    return this.getVariable("Agent.ToolsDirectory");
  }
  getBooleanInput(input, required) {
    return task.getBoolInput(input, required);
  }
  getInput(input, required) {
    return task.getInput(input, required)?.trim() ?? "";
  }
  getListInput(input, required) {
    return this.getInput(input, required).split("\n").filter((x) => x !== "");
  }
  setFailed(message, done) {
    task.setResult(task.TaskResult.Failed, message, done);
  }
  setOutput(name, value) {
    task.setVariable(name, value, false, true);
  }
  setSucceeded(message, done) {
    task.setResult(task.TaskResult.Succeeded, message, done);
  }
  getVariable(name) {
    return task.getVariable(name);
  }
  setVariable(name, value) {
    task.setVariable(name, value);
  }
  async which(tool, check) {
    return Promise.resolve(task.which(tool, check));
  }
}

export { BuildAgent };
//# sourceMappingURL=agent.js.map
