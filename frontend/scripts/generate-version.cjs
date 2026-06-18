const { execSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const rootDir = join(__dirname, '..');
const version = process.env.APP_VERSION || createBuildVersion();
const generatedAt = new Date().toISOString();

const payload = {
  version,
  generatedAt
};

mkdirSync(join(rootDir, 'public'), { recursive: true });

writeFileSync(join(rootDir, 'public', 'version.json'), `${JSON.stringify(payload, null, 2)}\n`);

function createBuildVersion() {
  const gitHash = readGitHash();
  const timestamp = compactTimestamp(new Date());

  return gitHash ? `${timestamp}-${gitHash}` : timestamp;
}

function readGitHash() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

function compactTimestamp(date) {
  return date.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}
