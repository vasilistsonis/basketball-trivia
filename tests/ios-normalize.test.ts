import assert from 'node:assert/strict';
import test from 'node:test';
import { getLocalPackagePaths, normalizePackagePaths } from '../scripts/ios-normalize.mjs';

test('Windows Capacitor package paths become portable without changing other Swift content', () => {
  const generated = String.raw`// Generated package example
let literal = "keep\\this\\escape"
let package = Package(
  dependencies: [
    .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.4.1"),
    .package(name: "CapacitorApp", path: "..\..\..\node_modules\@capacitor\app"),
    .package(path: "..\..\..\node_modules\local plugin")
  ],
  targets: [.target(name: "Keep", path: "keep\target")]
)
`;
  const expected = generated
    .replace(String.raw`..\..\..\node_modules\@capacitor\app`, '../../../node_modules/@capacitor/app')
    .replace(String.raw`..\..\..\node_modules\local plugin`, '../../../node_modules/local plugin');
  assert.equal(normalizePackagePaths(generated), expected);
  assert.deepEqual(getLocalPackagePaths(expected), ['../../../node_modules/@capacitor/app', '../../../node_modules/local plugin']);
});

test('macOS manifests and repeated normalization remain byte-for-byte unchanged', () => {
  const source = '    .package(name: "CapacitorShare", path: "../../../node_modules/@capacitor/share"),\r\n';
  assert.equal(normalizePackagePaths(source), source);
  assert.equal(normalizePackagePaths(normalizePackagePaths(source)), source);
});
