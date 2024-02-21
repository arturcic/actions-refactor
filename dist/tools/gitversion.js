import 'util';
import 'node:os';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '../common/semver.js';
import { S as SettingsProvider, D as DotnetTool, p as parseCliArgs, g as getAgent } from '../common/tools.js';

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

class GitVersionSettingsProvider extends SettingsProvider {
  getGitVersionSettings() {
    const targetPath = this.buildAgent.getInput(ExecuteFields.targetPath);
    const useConfigFile = this.buildAgent.getBooleanInput(ExecuteFields.useConfigFile);
    const configFilePath = this.buildAgent.getInput(ExecuteFields.configFilePath);
    const updateAssemblyInfo = this.buildAgent.getBooleanInput(ExecuteFields.updateAssemblyInfo);
    const updateAssemblyInfoFilename = this.buildAgent.getInput(ExecuteFields.updateAssemblyInfoFilename);
    const additionalArguments = this.buildAgent.getInput(ExecuteFields.additionalArguments);
    const srcDir = this.buildAgent.sourceDir?.replace(/\\/g, "/");
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
        this.buildAgent.setOutput(`GitVersion_${property}`, value);
        this.buildAgent.setVariable(name, value);
        this.buildAgent.setVariable(`GitVersion_${property}`, value);
      } catch (error) {
        this.buildAgent.error(`Unable to set output/variable for ${property}`);
      }
    }
  }
  getRepoDir(targetPath) {
    let workDir;
    if (!targetPath) {
      workDir = this.buildAgent.sourceDir || ".";
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

class Runner {
  agent;
  gitVersionTool;
  async execute() {
    const { command, buildAgent } = parseCliArgs();
    this.agent = await getAgent(buildAgent);
    this.gitVersionTool = new GitVersionTool(this.agent);
    switch (command) {
      case "setup":
        await this.setup();
        break;
      case "execute":
        await this.run();
        break;
    }
  }
  async setup() {
    try {
      this.agent.info(`Running on: '${this.agent.agentName}'`);
      this.agent.debug("Disabling telemetry");
      this.gitVersionTool.disableTelemetry();
      this.agent.debug("Installing GitVersion");
      await this.gitVersionTool.install();
    } catch (error) {
      console.log(error);
    }
  }
  async run() {
    try {
      this.agent.debug(`Agent: '${this.agent.agentName}'`);
      this.agent.debug("Disabling telemetry");
      this.gitVersionTool.disableTelemetry();
      this.agent.debug("Executing GitVersion");
      const result = await this.gitVersionTool.run();
      if (result.code === 0) {
        this.agent.debug("GitVersion executed successfully");
        const { stdout } = result;
        if (stdout.lastIndexOf("{") === -1 || stdout.lastIndexOf("}") === -1) {
          this.agent.debug("GitVersion output is not valid JSON");
          this.agent.setFailed("GitVersion output is not valid JSON", true);
          return;
        } else {
          const jsonOutput = stdout.substring(stdout.lastIndexOf("{"), stdout.lastIndexOf("}") + 1);
          const gitVersionOutput = JSON.parse(jsonOutput);
          this.gitVersionTool.writeGitVersionToAgent(gitVersionOutput);
          this.agent.setSucceeded("GitVersion executed successfully", true);
        }
      } else {
        this.agent.debug("GitVersion failed");
        const error = result.error;
        if (error instanceof Error) {
          this.agent.setFailed(error?.message, true);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        this.agent.setFailed(error?.message, true);
      }
    }
  }
}

const runner = new Runner();
await runner.execute();
//# sourceMappingURL=gitversion.js.map
