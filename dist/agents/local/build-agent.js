import * as process from 'node:process';
import * as util from 'node:util';
import { exec } from 'node:child_process';
import { B as BuildAgentBase } from '../../common/agents.js';

class BuildAgent extends BuildAgentBase {
  agentName = "Local";
  sourceDirVariable = "AGENT_SOURCE_DIR";
  tempDirVariable = "AGENT_TEMP_DIR";
  cacheDirVariable = "AGENT_TOOLS_DIR";
  debug = (message) => console.log(`[debug] ${message}`);
  info = (message) => console.log(`[info] - ${message}`);
  warn = (message) => console.warn(`[warn] - ${message}`);
  error = (message) => console.error(`[error] - ${message}`);
  async exec(cmd, args) {
    const exec$1 = util.promisify(exec);
    try {
      const { stdout, stderr } = await exec$1(`${cmd} ${args.join(" ")}`);
      return {
        code: 0,
        error: null,
        stderr,
        stdout
      };
    } catch (e) {
      const error = e;
      return {
        code: error.code,
        error,
        stderr: error.stderr,
        stdout: error.stdout
      };
    }
  }
  setFailed = (message, done) => this.error(`setFailed - ${message} - ${done}`);
  setOutput = (name, value) => this.debug(`setOutput - ${name} - ${value}`);
  setSucceeded = (message, done) => this.info(`setSucceeded - ${message} - ${done}`);
  setVariable(name, value) {
    this.debug(`setVariable - ${name} - ${value}`);
    process.env[name] = value;
  }
}

export { BuildAgent };
//# sourceMappingURL=build-agent.js.map
