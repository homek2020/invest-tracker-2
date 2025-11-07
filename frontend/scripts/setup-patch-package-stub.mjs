import { chmod, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const rootDir = process.cwd();
const binDir = join(rootDir, 'node_modules', '.bin');
const unixStubPath = join(binDir, 'patch-package');
const windowsStubPath = join(binDir, 'patch-package.cmd');
const message = '[invest-tracker] patch-package stub executed: no local patches to apply.';

async function ensureUnixStub() {
  const content = `#!/usr/bin/env node\nconsole.log('${message.replace(/'/g, "\\'")}');\n`;
  await writeFile(unixStubPath, content, { mode: 0o755 });
  await chmod(unixStubPath, 0o755);
}

async function ensureWindowsStub() {
  const content = `@ECHO OFF\r\nnode \\"%~dp0\\..\\..\\scripts\\patch-package-stub.js\\" %*\r\n`;
  await writeFile(windowsStubPath, content, 'utf8');
}

async function main() {
  await mkdir(binDir, { recursive: true });
  await Promise.all([ensureUnixStub(), ensureWindowsStub()]);
}

main().catch((err) => {
  console.warn('[invest-tracker] Unable to create patch-package stub:', err);
});
