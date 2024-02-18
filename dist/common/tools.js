import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { d as semver } from './semver.js';
import { parseArgs } from 'util';

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

export { DotnetTool as D, SettingsProvider as S, parseCliArgs as p };
//# sourceMappingURL=tools.js.map
