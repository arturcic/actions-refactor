#!/usr/bin/env node
import sum from './sum.ts';

export { default as sum } from './sum.ts';
export { default as subtract } from './subtract.ts';

console.log(sum(2, 3))