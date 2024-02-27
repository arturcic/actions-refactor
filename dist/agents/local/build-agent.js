import * as process from 'node:process';
import { B as BuildAgentBase } from '../../common/agents.js';

class BuildAgent extends BuildAgentBase {
  agentName = "Local";
  sourceDirVariable = "AGENT_SOURCE_DIR";
  tempDirVariable = "AGENT_TEMP_DIR";
  cacheDirVariable = "AGENT_TOOLS_DIR";
  debug = (message) => console.debug(`[debug] ${message}`);
  info = (message) => console.log(`[info] - ${message}`);
  warn = (message) => console.warn(`[warn] - ${message}`);
  error = (message) => console.error(`[error] - ${message}`);
  setSucceeded = (message, done) => this.info(`setSucceeded - ${message} - ${done}`);
  setFailed = (message, done) => this.error(`setFailed - ${message} - ${done}`);
  setOutput = (name, value) => this.debug(`setOutput - ${name} - ${value}`);
  setVariable(name, value) {
    this.debug(`setVariable - ${name} - ${value}`);
    process.env[name] = value;
  }
}

export { BuildAgent };
//# sourceMappingURL=build-agent.js.map
