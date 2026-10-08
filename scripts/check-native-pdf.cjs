// Sharing's Android permission lookup needs FileSystemPackage, even if JS only
// imports expo-print and expo-sharing. SDK 52 does not link nested-only modules.
const { execFileSync } = require('node:child_process');
const result = JSON.parse(execFileSync('npx', ['expo-modules-autolinking', 'resolve', '--platform', 'android', '--json'], { encoding: 'utf8' }));
for (const name of ['expo-file-system', 'expo-print', 'expo-sharing']) {
  const module = result.modules.find(entry => entry.packageName === name);
  if (!module) throw new Error(`PDF export requires the native module ${name}`);
}
const fs = require('node:fs');
const path = require('node:path');
const directory = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'pdf-native-'));
try {
  const target = path.join(directory, 'ExpoModulesPackageList.java');
  execFileSync('npx', ['expo-modules-autolinking', 'generate-package-list', '--platform', 'android', '--target', target, '--namespace', 'expo.modules'], { encoding: 'utf8' });
  if (!fs.readFileSync(target, 'utf8').includes('expo.modules.filesystem.FileSystemPackage')) {
    throw new Error('PDF sharing requires the Android FileSystemPackage permission provider');
  }
} finally { fs.rmSync(directory, { recursive: true, force: true }); }
console.log('Native PDF modules and file permission provider are linked.');
