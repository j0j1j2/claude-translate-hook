#!/usr/bin/env node

// Internal command: called by Claude Code hook system
if (process.argv[2] === 'hook') {
  const { runHook } = await import('../src/hook.mjs');
  await runHook();
} else {
  // Interactive setup for everything else
  const { interactive } = await import('../src/interactive.mjs');
  await interactive();
}
