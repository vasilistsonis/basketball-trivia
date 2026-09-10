/** Repair Capacitor's Windows path separators in the generated Swift manifest. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Match only generated local .package declarations, never URLs, .target paths,
// Swift string escapes elsewhere, or arbitrary files under ios/.
const localPackage = /^(\s*\.package\(\s*(?:name:\s*"[^"\r\n]*"\s*,\s*)?path:\s*")([^"\r\n]*)(")/gm;

export function getLocalPackagePaths(source) {
  return [...source.matchAll(localPackage)].map(match => match[2]);
}

export function normalizePackagePaths(source) {
  return source.replace(localPackage, (_match, before, path, after) => before + path.replace(/\\+/g, '/') + after);
}

async function main() {
  // Capacitor supplies this for hooks; an explicit standalone run also works.
  const platform = process.env.CAPACITOR_PLATFORM_NAME;
  if (platform && platform !== 'ios') return;

  const manifest = fileURLToPath(new URL('../ios/App/CapApp-SPM/Package.swift', import.meta.url));
  const source = await readFile(manifest, 'utf8');
  if (!source.includes('// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands')
      || !source.includes('name: "CapApp-SPM"')) {
    throw new Error('Expected the Capacitor-generated CapApp-SPM manifest; no file was changed.');
  }
  const normalized = normalizePackagePaths(source);
  if (normalized === source) {
    console.log('iOS Swift package paths already use portable separators.');
    return;
  }
  const changed = getLocalPackagePaths(source).filter(path => path.includes('\\')).length;
  await writeFile(manifest, normalized, 'utf8');
  console.log(`Normalized ${changed} local iOS Swift package path${changed === 1 ? '' : 's'} for macOS.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main().catch(error => {
    console.error(`iOS Swift package normalization failed: ${error.message}`);
    process.exitCode = 1;
  });
}
