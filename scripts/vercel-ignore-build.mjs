import { spawnSync } from 'node:child_process';

// Vercel's convention: 0 skips the build, 1 builds. Never skip on uncertainty.
const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA;
const currentSha = process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD';
const validRef = value => value === 'HEAD' || /^[a-f0-9]{7,40}$/i.test(value ?? '');
if (!previousSha || !validRef(previousSha) || !validRef(currentSha)) {
  console.log('Build front: no usable previous deployment commit.');
  process.exit(1);
}

const diff = spawnSync('git', ['diff', '--name-only', '-z', previousSha, currentSha], { encoding: 'utf8' });
if (diff.status !== 0) {
  console.log('Build front: commit comparison unavailable.');
  process.exit(1);
}

const sharedConfig = new Set([
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.base.json',
  'vercel.json', '.npmrc', '.node-version', '.nvmrc', '.vercelignore',
]);
const changed = diff.stdout.split('\0').filter(Boolean);
const affectsFront = changed.some(file =>
  file.startsWith('front/') || file.startsWith('packages/shared/') ||
  file.startsWith('scripts/') || sharedConfig.has(file),
);
console.log(affectsFront ? 'Build front: app, shared dependency or build configuration changed.' : 'Skip front: no relevant changes.');
process.exit(affectsFront ? 1 : 0);
