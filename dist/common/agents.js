async function getAgent(buildAgent) {
  const agent = `../agents/${buildAgent}/agent.js`;
  const module = await import(agent);
  return new module.BuildAgent();
}

export { getAgent as g };
//# sourceMappingURL=agents.js.map
