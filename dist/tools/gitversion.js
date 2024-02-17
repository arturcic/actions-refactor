import { parseArgs } from 'util';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { s as semver } from './semver.js';

var SetupFields = /* @__PURE__ */ ((SetupFields2) => {
  SetupFields2["includePrerelease"] = "includePrerelease";
  SetupFields2["versionSpec"] = "versionSpec";
  SetupFields2["ignoreFailedSources"] = "ignoreFailedSources";
  SetupFields2["preferLatestVersion"] = "preferLatestVersion";
  return SetupFields2;
})(SetupFields || {});

class DotnetTool {
  constructor(buildAgent) {
    this.buildAgent = buildAgent;
  }
  static nugetRoot = "https://azuresearch-usnc.nuget.org/";
  disableTelemetry() {
    this.buildAgent.info("Disable Telemetry");
    this.buildAgent.setVariable("DOTNET_CLI_TELEMETRY_OPTOUT", "true");
    this.buildAgent.setVariable("DOTNET_NOLOGO", "true");
  }
  async execute(cmd, args) {
    this.buildAgent.info(`Command: ${cmd} ${args.join(" ")}`);
    return this.buildAgent.exec(cmd, args);
  }
  async install() {
    const dotnetExePath = await this.buildAgent.which("dotnet", true);
    this.buildAgent.debug(`whichPath: ${dotnetExePath}`);
    await this.setDotnetRoot();
    const setupSettings = this.settingsProvider.getSetupSettings();
    let version = semver.clean(setupSettings.versionSpec) || setupSettings.versionSpec;
    this.buildAgent.info("--------------------------");
    this.buildAgent.info(`Acquiring ${this.toolName} for version spec: ${version}`);
    this.buildAgent.info("--------------------------");
    if (!this.isExplicitVersion(version)) {
      version = await this.queryLatestMatch(this.toolName, version, setupSettings.includePrerelease);
      if (!version) {
        throw new Error(`Unable to find ${this.toolName} version '${version}'.`);
      }
    }
    let toolPath = null;
    if (!setupSettings.preferLatestVersion) {
      toolPath = this.buildAgent.findLocalTool(this.toolName, version);
    }
    if (!toolPath) {
      toolPath = await this.installTool(this.toolName, version, setupSettings.ignoreFailedSources);
    }
    this.buildAgent.info("--------------------------");
    this.buildAgent.info(`${this.toolName} version: ${version} installed.`);
    this.buildAgent.info("--------------------------");
    this.buildAgent.info(`Prepending ${toolPath} to PATH`);
    this.buildAgent.debug(`toolPath: ${toolPath}`);
    this.buildAgent.addPath(toolPath);
    return toolPath;
  }
  async setDotnetRoot() {
    if (os.platform() !== "win32" && !this.buildAgent.getVariable("DOTNET_ROOT")) {
      let dotnetPath = await this.buildAgent.which("dotnet", true);
      dotnetPath = fs.readlinkSync(dotnetPath) || dotnetPath;
      const dotnetRoot = path.dirname(dotnetPath);
      this.buildAgent.setVariable("DOTNET_ROOT", dotnetRoot);
    }
  }
  isValidInputFile(input, file) {
    return this.filePathSupplied(input) && this.buildAgent.fileExists(file);
  }
  filePathSupplied(file) {
    const pathValue = path.resolve(this.buildAgent.getInput(file) || "");
    const repoRoot = this.buildAgent.getSourceDir();
    return pathValue !== repoRoot;
  }
  async queryLatestMatch(toolName, versionSpec, includePrerelease) {
    this.buildAgent.info(
      `Querying tool versions for ${toolName}${versionSpec ? `@${versionSpec}` : ""} ${includePrerelease ? "including pre-releases" : ""}`
    );
    const toolNameParam = encodeURIComponent(toolName.toLowerCase());
    const prereleaseParam = includePrerelease ? "true" : "false";
    const downloadPath = `${DotnetTool.nugetRoot}query?q=${toolNameParam}&prerelease=${prereleaseParam}&semVerLevel=2.0.0&take=1`;
    const response = await fetch(downloadPath);
    if (!response || !response.ok) {
      this.buildAgent.warn(`failed to query latest version for ${toolName} from ${downloadPath}. Status code: ${response ? response.status : "unknown"}`);
      return null;
    }
    const { data } = await response.json();
    const versions = data[0].versions.map((x) => x.version);
    if (!versions || !versions.length) {
      return null;
    }
    this.buildAgent.debug(`got versions: ${versions.join(", ")}`);
    const version = semver.maxSatisfying(versions, versionSpec, { includePrerelease });
    if (version) {
      this.buildAgent.info(`Found matching version: ${version}`);
    } else {
      this.buildAgent.info("match not found");
    }
    return version;
  }
  async installTool(toolName, version, ignoreFailedSources) {
    const semverVersion = semver.clean(version);
    if (!semverVersion) {
      throw new Error(`Invalid version spec: ${version}`);
    }
    const tempDirectory = await this.createTempDir();
    if (!tempDirectory) {
      throw new Error("Unable to create temp directory");
    }
    const args = ["tool", "install", toolName, "--tool-path", tempDirectory, "--version", semverVersion];
    if (ignoreFailedSources) {
      args.push("--ignore-failed-sources");
    }
    const result = await this.execute("dotnet", args);
    const status = result.code === 0 ? "success" : "failure";
    const message = result.code === 0 ? result.stdout : result.stderr;
    this.buildAgent.debug(`Tool install result: ${status} ${message}`);
    if (result.code !== 0) {
      throw new Error(message);
    }
    this.buildAgent.info(message);
    return await this.buildAgent.cacheDir(tempDirectory, toolName, semverVersion);
  }
  async createTempDir() {
    const tempRootDir = this.buildAgent.getTempRootDir();
    if (!tempRootDir) {
      throw new Error("Temp directory not set");
    }
    const uuid = crypto.randomUUID();
    const tempPath = path.join(tempRootDir, uuid);
    this.buildAgent.debug(`Creating temp directory ${tempPath}`);
    fs.mkdirSync(tempPath);
    return Promise.resolve(tempPath);
  }
  isExplicitVersion(versionSpec) {
    const cleanedVersionSpec = semver.clean(versionSpec);
    const valid = semver.valid(cleanedVersionSpec) != null;
    this.buildAgent.debug(`Is version explicit? ${valid}`);
    return valid;
  }
}

function parseCliArgs() {
  return parseArgs({
    options: {
      command: { type: "string", short: "c" },
      buildAgent: { type: "string", short: "a" }
    }
  }).values;
}

var ExecuteFields = /* @__PURE__ */ ((ExecuteFields2) => {
  ExecuteFields2["targetPath"] = "targetPath";
  ExecuteFields2["useConfigFile"] = "useConfigFile";
  ExecuteFields2["configFilePath"] = "configFilePath";
  ExecuteFields2["updateAssemblyInfo"] = "updateAssemblyInfo";
  ExecuteFields2["updateAssemblyInfoFilename"] = "updateAssemblyInfoFilename";
  ExecuteFields2["additionalArguments"] = "additionalArguments";
  ExecuteFields2["srcDir"] = "srcDir";
  return ExecuteFields2;
})(ExecuteFields || {});

class SettingsProvider {
  constructor(buildAgent) {
    this.buildAgent = buildAgent;
  }
  getSetupSettings() {
    const versionSpec = this.buildAgent.getInput(SetupFields.versionSpec);
    const includePrerelease = this.buildAgent.getBooleanInput(SetupFields.includePrerelease);
    const ignoreFailedSources = this.buildAgent.getBooleanInput(SetupFields.ignoreFailedSources);
    const preferLatestVersion = this.buildAgent.getBooleanInput(SetupFields.preferLatestVersion);
    return {
      versionSpec,
      includePrerelease,
      ignoreFailedSources,
      preferLatestVersion
    };
  }
}

class GitVersionSettingsProvider extends SettingsProvider {
  getGitVersionSettings() {
    const targetPath = this.buildAgent.getInput(ExecuteFields.targetPath);
    const useConfigFile = this.buildAgent.getBooleanInput(ExecuteFields.useConfigFile);
    const configFilePath = this.buildAgent.getInput(ExecuteFields.configFilePath);
    const updateAssemblyInfo = this.buildAgent.getBooleanInput(ExecuteFields.updateAssemblyInfo);
    const updateAssemblyInfoFilename = this.buildAgent.getInput(ExecuteFields.updateAssemblyInfoFilename);
    const additionalArguments = this.buildAgent.getInput(ExecuteFields.additionalArguments);
    const srcDir = this.buildAgent.getSourceDir()?.replace(/\\/g, "/");
    return {
      targetPath,
      useConfigFile,
      configFilePath,
      updateAssemblyInfo,
      updateAssemblyInfoFilename,
      additionalArguments,
      srcDir
    };
  }
}

class GitVersionTool extends DotnetTool {
  get toolName() {
    return "GitVersion.Tool";
  }
  get settingsProvider() {
    return new GitVersionSettingsProvider(this.buildAgent);
  }
  async run() {
    const settings = this.settingsProvider.getGitVersionSettings();
    const workDir = this.getRepoDir(settings.targetPath);
    const args = this.getArguments(workDir, settings);
    await this.setDotnetRoot();
    const toolPath = await this.buildAgent.which("dotnet-gitversion", true);
    return this.execute(toolPath, args);
  }
  writeGitVersionToAgent(output) {
    const keysFn = Object.keys;
    const keys = keysFn(output);
    for (const property of keys) {
      const name = this.toCamelCase(property);
      try {
        const value = output[property]?.toString();
        this.buildAgent.setOutput(name, value);
        this.buildAgent.setOutput(`GitVersion_${name}`, value);
        this.buildAgent.setVariable(name, value);
        this.buildAgent.setVariable(`GitVersion_${name}`, value);
      } catch (error) {
        this.buildAgent.error(`Unable to set output/variable for ${name}`);
      }
    }
  }
  getRepoDir(targetPath) {
    let workDir;
    const srcDir = this.buildAgent.getSourceDir() || ".";
    if (!targetPath) {
      workDir = srcDir;
    } else {
      if (this.buildAgent.dirExists(targetPath)) {
        workDir = targetPath;
      } else {
        throw new Error(`Directory not found at ${targetPath}`);
      }
    }
    return workDir.replace(/\\/g, "/");
  }
  getArguments(workDir, options) {
    let args = [workDir, "/output", "json", "/output", "buildserver"];
    const { useConfigFile, configFilePath, updateAssemblyInfo, updateAssemblyInfoFilename, additionalArguments } = options;
    if (useConfigFile) {
      if (this.isValidInputFile("configFilePath", configFilePath)) {
        args.push("/config", configFilePath);
      } else {
        throw new Error(`GitVersion configuration file not found at ${configFilePath}`);
      }
    }
    if (updateAssemblyInfo) {
      args.push("/updateassemblyinfo");
      if (updateAssemblyInfoFilename?.length > 0) {
        if (this.isValidInputFile("updateAssemblyInfoFilename", updateAssemblyInfoFilename)) {
          args.push(updateAssemblyInfoFilename);
        } else {
          throw new Error(`AssemblyInfoFilename file not found at ${updateAssemblyInfoFilename}`);
        }
      }
    }
    if (additionalArguments) {
      args = args.concat(this.argStringToArray(additionalArguments));
    }
    return args;
  }
  argStringToArray(argString) {
    const args = [];
    let inQuotes = false;
    let escaped = false;
    let lastCharWasSpace = true;
    let arg = "";
    const append = (c) => {
      if (escaped && c !== '"') {
        arg += "\\";
      }
      arg += c;
      escaped = false;
    };
    for (let i = 0; i < argString.length; i++) {
      const c = argString.charAt(i);
      if (c === " " && !inQuotes) {
        if (!lastCharWasSpace) {
          args.push(arg);
          arg = "";
        }
        lastCharWasSpace = true;
        continue;
      } else {
        lastCharWasSpace = false;
      }
      if (c === '"') {
        if (!escaped) {
          inQuotes = !inQuotes;
        } else {
          append(c);
        }
        continue;
      }
      if (c === "\\" && escaped) {
        append(c);
        continue;
      }
      if (c === "\\" && inQuotes) {
        escaped = true;
        continue;
      }
      append(c);
      lastCharWasSpace = false;
    }
    if (!lastCharWasSpace) {
      args.push(arg.trim());
    }
    return args;
  }
  toCamelCase(input) {
    return input.replace(/^\w|[A-Z]|\b\w|\s+/g, function(match, index) {
      if (+match === 0)
        return "";
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  }
}

const { command, buildAgent } = parseCliArgs();
const agent = await getAgent(buildAgent);
const gitVersionTool = new GitVersionTool(agent);
switch (command) {
  case "setup":
    await setup();
    break;
  case "execute":
    await run();
    break;
}
async function getAgent(buildAgent2) {
  const agent2 = `../agents/${buildAgent2}/agent.js`;
  const module = await import(agent2);
  return new module.BuildAgent();
}
async function setup() {
  try {
    agent.info(`Running on: '${agent.agentName}'`);
    agent.debug("Disabling telemetry");
    gitVersionTool.disableTelemetry();
    agent.debug("Installing GitVersion");
    await gitVersionTool.install();
  } catch (error) {
    console.log(error);
  }
}
async function run() {
  try {
    agent.debug(`Agent: '${agent.agentName}'`);
    agent.debug("Disabling telemetry");
    gitVersionTool.disableTelemetry();
    agent.debug("Executing GitVersion");
    const result = await gitVersionTool.run();
    if (result.code === 0) {
      agent.debug("GitVersion executed successfully");
      const { stdout } = result;
      if (stdout.lastIndexOf("{") === -1 || stdout.lastIndexOf("}") === -1) {
        agent.debug("GitVersion output is not valid JSON");
        agent.setFailed("GitVersion output is not valid JSON", true);
        return;
      } else {
        const jsonOutput = stdout.substring(stdout.lastIndexOf("{"), stdout.lastIndexOf("}") + 1);
        const gitVersionOutput = JSON.parse(jsonOutput);
        gitVersionTool.writeGitVersionToAgent(gitVersionOutput);
        agent.setSucceeded("GitVersion executed successfully", true);
      }
    } else {
      agent.debug("GitVersion failed");
      const error = result.error;
      if (error instanceof Error) {
        agent.setFailed(error?.message, true);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      agent.setFailed(error?.message, true);
    }
  }
}
//# sourceMappingURL=gitversion.js.map
