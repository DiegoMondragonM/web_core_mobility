import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const cwd = fileURLToPath(new URL('../', import.meta.url));
const vite = join(dirname(require.resolve('vite/package.json')), 'bin/vite.js');
const children = [
  spawn(process.execPath, ['--watch', 'server.js'], { cwd, stdio: 'inherit' }),
  spawn(process.execPath, [vite], { cwd, stdio: 'inherit' }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill();
}
for (const child of children) {
  child.on('error', error => { console.error(error); stop(1); });
  child.on('exit', code => stop(code ?? 0));
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
