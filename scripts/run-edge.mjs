import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const backend = resolve(root, 'edge server/polar-edge/backend');
const frontend = resolve(root, 'edge server/polar-edge/frontend');
const uvicorn = resolve(backend, '.venv/bin/uvicorn');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

if (!existsSync(uvicorn)) {
  console.error('Backend virtual environment is missing. Run:');
  console.error('  cd "edge server/polar-edge/backend" && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt');
  process.exit(1);
}

const processes = [
  spawn(uvicorn, ['main:app', '--reload', '--no-access-log', '--port', '8000'], {
    cwd: backend,
    env: {
      ...process.env,
      MAIN_SYNC_URL: process.env.MAIN_SYNC_URL ?? 'http://localhost:9000/internal/edge-sync',
    },
    stdio: 'inherit',
  }),
  spawn(npm, ['run', 'dev'], {
    cwd: frontend,
    stdio: 'inherit',
  }),
];

const stop = () => {
  for (const child of processes) child.kill('SIGTERM');
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
processes.forEach((child) => child.on('exit', (code) => {
  if (code && code !== 130) process.exitCode = code;
}));