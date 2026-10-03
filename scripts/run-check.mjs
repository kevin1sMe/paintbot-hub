import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'paintbot-check-'));
try {
  const outfile = join(directory, 'check.mjs');
  await build({
    entryPoints: [process.argv[2]],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    tsconfig: 'tsconfig.app.json',
  });
  const child = spawn(process.execPath, [...process.argv.slice(3), outfile], { stdio: 'inherit' });
  process.exitCode = await new Promise(resolve => child.on('exit', code => resolve(code ?? 1)));
} finally {
  await rm(directory, { recursive: true, force: true });
}
