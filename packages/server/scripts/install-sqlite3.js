/* eslint-disable @typescript-eslint/no-var-requires */
// Fetches the prebuilt better-sqlite3 native binding for the running Node
// ABI. The workspace keeps better-sqlite3 in the root `neverBuiltDependencies`
// list (so pnpm never runs its install script), which is fine for the desktop
// package — electron-rebuild produces its Electron-ABI binary into tmp/bin —
// but leaves this package's nested copy without a binding. pnpm neverBuiltDependencies
// blocks dep build scripts but not workspace postinstalls, so we fetch the
// prebuild here: no toolchain needed (prebuilds exist for Node 22 / 25 on all
// platforms), and node-gyp source build is the last-resort fallback.
const path = require('path')
const { spawnSync } = require('child_process')

// Resolve the actual better-sqlite3 install dir via Node resolution rather
// than a hard-coded relative path: with pnpm node-linker=hoisted the package
// lives at the repo root node_modules, not packages/server/node_modules.
const moduleDir = path.dirname(require.resolve('better-sqlite3/package.json'))
const binDir = path.join(moduleDir, 'build/Release')

try {
  // eslint-disable-next-line global-require
  require(path.join(binDir, 'better_sqlite3.node'))
  console.log('[install-sqlite3] binding already present, skipping')
  process.exit(0)
} catch {
  // expected when missing or ABI-mismatched — rebuild below
}

const resolveBin = file => {
  const candidates = ['bin.js', 'bin/node-gyp.js', 'bin/node-gyp-bin.js']
  for (const c of candidates) {
    try {
      return require.resolve(`${file}/${c}`)
    } catch {
      // try next
    }
  }
  throw new Error(`cannot resolve bin for ${file}`)
}

const run = (file, args) => {
  const result = spawnSync(process.execPath, [resolveBin(file), ...args], {
    cwd: moduleDir,
    stdio: 'inherit',
  })
  return result.status === 0
}

// 1. prebuilt binary for the current Node ABI (v12.11.1 ships node-v127/141
//    for all platforms — the normal path, downloads in ~1s).
if (!run('prebuild-install', ['-r', 'node'])) {
  // 2. fallback: compile from source (needs Xcode CLT / MSVC / gcc+python3).
  if (!run('node-gyp', ['rebuild'])) {
    console.error('[install-sqlite3] failed to provision better-sqlite3 binding')
    process.exit(1)
  }
}

try {
  require(path.join(binDir, 'better_sqlite3.node'))
  console.log('[install-sqlite3] binding ready')
} catch (e) {
  console.error('[install-sqlite3] binding still not loadable:', e.message)
  process.exit(1)
}
