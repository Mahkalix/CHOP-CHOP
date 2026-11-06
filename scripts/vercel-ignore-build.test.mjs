import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./vercel-ignore-build.mjs', import.meta.url));
test('Vercel builds front dependencies and safely skips unrelated changes', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'chop-vercel-'));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  const commit = file => {
    mkdirSync(dirname(join(cwd, file)), { recursive: true });
    writeFileSync(join(cwd, file), file);
    git('add', '.'); git('commit', '-qm', file);
  };
  const check = (expected, previous) => {
    const env = { ...process.env };
    delete env.VERCEL_GIT_PREVIOUS_SHA;
    delete env.VERCEL_GIT_COMMIT_SHA;
    if (previous) env.VERCEL_GIT_PREVIOUS_SHA = previous;
    const result = spawnSync(process.execPath, [script], { cwd, env, encoding: 'utf8' });
    assert.equal(result.status, expected, result.stdout + result.stderr);
  };
  try {
    git('init', '-q'); git('config', 'user.email', 'test@example.com'); git('config', 'user.name', 'Test');
    git('config', 'commit.gpgsign', 'false');
    commit('README.md');
    let base = git('rev-parse', 'HEAD');
    check(1); check(0, base);
    commit('apps/api/src/server.ts'); check(0, base);
    commit('front/src/App.tsx'); check(1, base);
    commit('docs/guide.md'); check(1, base); // include earlier front commit in the same push
    base = git('rev-parse', 'HEAD');
    commit('packages/shared/src/types.ts'); check(1, base);
    base = git('rev-parse', 'HEAD');
    commit('pnpm-lock.yaml'); check(1, base);
    check(1, 'a'.repeat(40)); check(1, '--invalid-ref');
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});
