import 'node:os';
import './semver.js';
import 'node:path';
import 'node:fs';
import 'node:process';

async function getAgent(buildAgent) {
  const agent = `../agents/${buildAgent}/agent.js`;
  const module = await import(agent);
  return new module.BuildAgent();
}

export { getAgent as g };
//# sourceMappingURL=agents.js.map
