#!/usr/bin/env node
import { parseCliArgs, printHelp, runDoctor, runInit, runSetup } from './setup.js';
import { runStdio } from './stdio.js';

async function run() {
  const { command, nonInteractive } = parseCliArgs(process.argv);

  switch (command) {
    case 'setup':
      await runSetup(nonInteractive);
      return;
    case 'doctor':
      await runDoctor();
      return;
    case 'init':
      await runInit();
      return;
    case 'stdio':
      await runStdio();
      return;
    case 'help':
      printHelp();
      return;
    default:
      printHelp();
      process.exitCode = 1;
  }
}

run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
