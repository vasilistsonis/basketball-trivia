/** Cross-platform preflight. Xcode compilation and device QA are separate, required steps. */
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { getLocalPackagePaths } from './ios-normalize.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceOnly = process.argv.includes('--source-only');
const errors = [];
let checks = 0;
function check(condition, description) {
  checks++;
  if (!condition) errors.push(description);
}
async function text(path) {
  try { return await readFile(join(root, path), 'utf8'); }
  catch { errors.push(`Missing ${path}`); return ''; }
}
async function json(path) {
  const value = await text(path);
  try { return JSON.parse(value); }
  catch { if (value) errors.push(`Invalid JSON in ${path}`); return {}; }
}
async function files(path, prefix = '') {
  const entries = await readdir(join(root, path, prefix), { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const relative = join(prefix, entry.name);
    if (entry.isDirectory()) output.push(...await files(path, relative));
    else if (entry.isFile()) output.push(relative);
  }
  return output;
}
function plistString(source, key) {
  return source.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`))?.[1];
}
const capacitor = await text('capacitor.config.ts');
const project = await text('ios/App/App.xcodeproj/project.pbxproj');
const info = await text('ios/App/App/Info.plist');
const privacy = await text('ios/App/App/PrivacyInfo.xcprivacy');
const swiftPackage = await text('ios/App/CapApp-SPM/Package.swift');
const scheme = await text('ios/App/App.xcodeproj/xcshareddata/xcschemes/App.xcscheme');
const lock = await json('package-lock.json');
const packageJson = await json('package.json');
const appId = capacitor.match(/appId:\s*['"]([^'"]+)['"]/)?.[1];
const bundleIds = [...project.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map(match => match[1]);
check(Boolean(appId) && bundleIds.length === 2 && bundleIds.every(id => id === appId), 'Capacitor and both Xcode bundle identifiers must match.');
check(plistString(info, 'CFBundleDisplayName') === capacitor.match(/appName:\s*['"]([^'"]+)['"]/)?.[1], 'Native display name must match Capacitor appName.');
check([...project.matchAll(/MARKETING_VERSION = ([^;]+);/g)].every(match => match[1] === packageJson.version), 'Xcode marketing version must match package.json version.');
check(/contentInset:\s*['"]never['"]/.test(capacitor), 'WKWebView insets must be disabled because CSS owns the safe areas.');
check(plistString(info, 'UIUserInterfaceStyle') === 'Light', 'The fixed paper palette requires the Light native interface style.');
check(!/NSAllowsArbitraryLoads/.test(info), 'Remove broad App Transport Security exceptions from Info.plist.');
check(!/<string>armv7<\/string>/.test(info), 'Remove obsolete armv7-only device capability requirements.');
check(/<key>NSPrivacyTracking<\/key>\s*<false\s*\/>/.test(privacy), 'The app privacy manifest must explicitly disable tracking.');
check((project.match(/PrivacyInfo\.xcprivacy in Resources/g) ?? []).length >= 2, 'The app privacy manifest must be included in the Xcode Resources phase.');
check(/BlueprintIdentifier="504EC3031FED79650016851F"/.test(scheme) && /ArchiveAction buildConfiguration="Release"/.test(scheme), 'The shared App scheme must build the app and archive its Release configuration.');
const targets = [...project.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([^;]+);/g)].map(match => Number(match[1]));
const packageTarget = Number(swiftPackage.match(/\.iOS\(\.v(\d+)\)/)?.[1]);
check(targets.length === 4 && targets.every(target => target === packageTarget && target >= 15), 'All Xcode and Swift Package deployment targets must agree and support Capacitor 8.');
const coreVersion = lock.packages?.['node_modules/@capacitor/core']?.version;
check(Boolean(coreVersion) && ['ios', 'cli'].every(name => lock.packages?.[`node_modules/@capacitor/${name}`]?.version === coreVersion), 'Lock Capacitor core, ios and cli to the same installed version.');
check(swiftPackage.includes(`exact: "${coreVersion}"`), 'Run cap sync ios to align the native Capacitor Swift package with package-lock.json.');
for (const path of getLocalPackagePaths(swiftPackage)) {
  check(!path.includes('\\'), `Local Swift package path contains Windows backslashes: ${path}. Run node scripts/ios-normalize.mjs.`);
  const portable = path.replace(/\\/g, '/');
  const packageDirectory = resolve(root, 'ios/App/CapApp-SPM', portable);
  const insideProject = relative(root, packageDirectory);
  const validRelative = !isAbsolute(portable) && !/^[a-z]:/i.test(portable)
    && insideProject !== '..' && !insideProject.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
    && !isAbsolute(insideProject);
  check(validRelative, `Local Swift package must resolve inside this project: ${path}`);
  if (validRelative) {
    let exists = false;
    try { exists = (await stat(join(packageDirectory, 'Package.swift'))).isFile(); } catch { /* Report below. */ }
    check(exists, `Local Swift package ${path} has no Package.swift; run npm ci and cap sync ios.`);
  }
}

for (const [catalogPath, isIcon] of [
  ['ios/App/App/Assets.xcassets/AppIcon.appiconset', true],
  ['ios/App/App/Assets.xcassets/Splash.imageset', false],
]) {
  const catalog = await json(`${catalogPath}/Contents.json`);
  for (const item of catalog.images ?? []) {
    if (!item.filename) continue;
    try {
      const png = await readFile(join(root, catalogPath, item.filename));
      const width = png.readUInt32BE(16);
      const height = png.readUInt32BE(20);
      check(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${item.filename} must be a PNG.`);
      if (isIcon) {
        check(width === 1024 && height === 1024, 'App Store icon must be 1024 by 1024 pixels.');
        check(png[25] === 2 && !png.includes(Buffer.from('tRNS')), 'App Store icon must be opaque RGB without transparency.');
      } else {
        const scale = Number.parseInt(item.scale ?? '1', 10);
        check(width === 128 * scale && height === 128 * scale, `Launch mark ${item.scale} must represent the same 128pt size.`);
      }
    } catch { errors.push(`Cannot read asset ${catalogPath}/${item.filename}`); }
  }
}

if (!sourceOnly) {
  const nativeConfig = await json('ios/App/App/capacitor.config.json');
  check(nativeConfig.appId === appId && nativeConfig.ios?.contentInset === 'never', 'Native generated configuration is stale; run cap sync ios.');
  check(!nativeConfig.server?.url && !nativeConfig.server?.cleartext, 'The release app must use bundled assets without a live development server.');
  for (const plugin of Object.keys(packageJson.dependencies ?? {}).filter(name => /^@capacitor\//.test(name) && !['@capacitor/core', '@capacitor/ios', '@capacitor/android'].includes(name))) {
    check(swiftPackage.includes(plugin), `Native plugin ${plugin} is missing from Swift Package Manager; run cap sync ios.`);
  }
  try {
    const buildFiles = await files('dist');
    check(buildFiles.includes('index.html'), 'Build output needs an index.html.');
    let newestSource = 0;
    for (const source of [...await files('src'), '../index.html', '../package-lock.json']) {
      newestSource = Math.max(newestSource, (await stat(join(root, 'src', source))).mtimeMs);
    }
    check((await stat(join(root, 'dist/index.html'))).mtimeMs >= newestSource, 'Web build predates source changes; run npm run build and sync again.');
    for (const relative of buildFiles) {
      const built = await readFile(join(root, 'dist', relative));
      let copied;
      try { copied = await readFile(join(root, 'ios/App/App/public', relative)); }
      catch { errors.push(`Native bundle is missing ${relative}; run cap sync ios.`); continue; }
      check(createHash('sha256').update(built).digest('hex') === createHash('sha256').update(copied).digest('hex'), `Native copy differs from dist/${relative}; run cap sync ios.`);
      if (/\.(?:html|js|css|json)$/.test(relative)) {
        const source = built.toString('utf8');
        check(!/sb_secret_[A-Za-z0-9_-]+/.test(source), `A server-only Supabase secret appears in ${relative}; remove it and rebuild.`);
        const tokens = source.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? [];
        check(!tokens.some(token => {
          try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).role === 'service_role'; }
          catch { return false; }
        }), `A server-only service-role token appears in ${relative}; remove it and rebuild.`);
        check(!/fonts\.(?:googleapis|gstatic)\.com/.test(source), `Fonts must be bundled for offline play; remote font dependency in ${relative}.`);
      }
    }
  } catch (error) {
    errors.push(`Build verification could not finish (${error.code ?? error.message}); build and sync first.`);
  }
}

if (errors.length) {
  console.error(`iOS preflight failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`iOS ${sourceOnly ? 'source' : 'bundle'} preflight passed (${checks} checks).`);
  console.log('Native compilation, signing and device QA must still run with Xcode on macOS.');
}
