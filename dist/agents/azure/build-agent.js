import { B as BuildAgentBase } from '../../common/agents.js';

const CMD_PREFIX = "##vso[";
var TaskResult = /* @__PURE__ */ ((TaskResult2) => {
  TaskResult2[TaskResult2["Succeeded"] = 0] = "Succeeded";
  TaskResult2[TaskResult2["SucceededWithIssues"] = 1] = "SucceededWithIssues";
  TaskResult2[TaskResult2["Failed"] = 2] = "Failed";
  TaskResult2[TaskResult2["Cancelled"] = 3] = "Cancelled";
  TaskResult2[TaskResult2["Skipped"] = 4] = "Skipped";
  return TaskResult2;
})(TaskResult || {});
class TaskCommand {
  constructor(command, properties, message) {
    this.command = command;
    this.properties = properties;
    this.message = message;
    if (!command) {
      this.command = "missing.command";
    }
  }
  toString() {
    let cmdStr = CMD_PREFIX + this.command;
    if (this.properties && Object.keys(this.properties).length > 0) {
      cmdStr += " ";
      for (const key in this.properties) {
        if (this.properties.hasOwnProperty(key)) {
          const val = this.properties[key];
          if (val) {
            cmdStr += `${key}=${escape(`${val || ""}`)};`;
          }
        }
      }
    }
    cmdStr += "]";
    const message = `${this.message || ""}`;
    cmdStr += escapeData(message);
    return cmdStr;
  }
}
function escapeData(s) {
  return s.replace(/%/g, "%AZP25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escape(s) {
  return s.replace(/%/g, "%AZP25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/]/g, "%5D").replace(/;/g, "%3B");
}

class BuildAgent extends BuildAgentBase {
  agentName = "Azure Pipelines";
  sourceDirVariable = "BUILD_SOURCESDIRECTORY";
  tempDirVariable = "AGENT_TEMPDIRECTORY";
  cacheDirVariable = "AGENT_TOOLSDIRECTORY";
  addPath(inputPath) {
    super.addPath(inputPath);
    this._command("task.prependpath", null, inputPath);
  }
  info = (message) => this.debug(message);
  debug = (message) => this._command("task.debug", null, message);
  warning = (message) => this._command("task.issue", { type: "warning" }, message);
  error = (message) => this._command("task.issue", { type: "error" }, message);
  setSucceeded = (message, done) => this._setResult(TaskResult.Succeeded, message, done);
  setFailed = (message, done) => this._setResult(TaskResult.Failed, message, done);
  setOutput = (name, value) => this._setVariable(name, value, true);
  setVariable = (name, value) => this._setVariable(name, value);
  _command(command, properties, message) {
    const taskCmd = new TaskCommand(command, properties, message);
    console.log(taskCmd.toString());
  }
  _setResult(result, message, done) {
    this.debug(`task result: ${TaskResult[result]}`);
    if (result === TaskResult.Failed && message) {
      this.error(message);
    } else if (result === TaskResult.SucceededWithIssues && message) {
      this.warning(message);
    }
    const properties = { result: TaskResult[result] };
    if (done) {
      properties["done"] = "true";
    }
    this._command("task.complete", properties, message);
  }
  _setVariable(name, val, isOutput = false) {
    const key = this._getVariableKey(name);
    const varValue = val || "";
    process.env[key] = varValue;
    this._command(
      "task.setvariable",
      {
        variable: name || "",
        isOutput: (isOutput || false).toString(),
        issecret: "false"
      },
      varValue
    );
  }
  _getVariableKey(name) {
    return name.replace(/\./g, "_").replace(/ /g, "_").toUpperCase();
  }
}

export { BuildAgent };
//# sourceMappingURL=build-agent.js.map
