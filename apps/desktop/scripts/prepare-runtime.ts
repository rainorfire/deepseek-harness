/** Prepare Desktop resources and publish their versions after every preparation stage succeeds. */

import { execFileSync } from 'node:child_process'
import { chmodSync, cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { downloadArtifact } from '@electron/get'
import extractZip from 'extract-zip'
import { readPrimaryRuntime } from '../../../packages/skill/tool-workspace-dependencies/src/index.ts'
import { desktopTargetPlatform, resolveDesktopBuildTarget, resolveDesktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { packagingStep } from './packaging-step.mjs'
import { preparePrimaryRuntime } from './prepare-primary-runtime.ts'
import { prepareDesktopCli } from './prepare-cli.ts'
import { prepareCommandLink } from './prepare-command-link.ts'

const BUILD_PATHS = resolveDesktopTargetBuildPaths()
const RUNTIME_ROOT = BUILD_PATHS.runtime

type DesktopTarget = ReturnType<typeof desktopTargetPlatform>

/**
 * Read `DSH_DESKTOP_ELECTRON_CHECKSUMS` as `{ artifactName: sha256 }` for the requested Electron artifact.
 * Set it only where the release checksum file is unreachable and the archive is already verified.
 * @returns the checksum map, or undefined to download the release's own checksum file.
 */
function resolveElectronChecksums(
  version: string, platform: NodeJS.Platform, arch: NodeJS.Architecture,
): Record<string, string> | undefined {
  const raw = process.env.DSH_DESKTOP_ELECTRON_CHECKSUMS
  if (raw === undefined || raw.trim() === '') return undefined
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('DSH_DESKTOP_ELECTRON_CHECKSUMS must be a JSON object')
  const file = `electron-v${version}-${platform === 'win32' ? 'win32' : platform}-${arch}.zip`
  const entries = Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value)))
  if (Object.keys(entries).length === 0) throw new Error('DSH_DESKTOP_ELECTRON_CHECKSUMS needs at least one artifact checksum')
  const selected = entries[file]
  return selected === undefined ? entries : { [file]: selected }
}

/** Extract the target Electron distribution and return its embedded Node version. */
async function prepareElectron({ platform, arch }: DesktopTarget): Promise<string> {
  const require = createRequire(import.meta.url)
  const { version } = require('electron/package.json') as { version: string }
  // A CI-provided checksum map lets the cache serve the archive without the
  // release's SHASUMS256.txt, which GitHub's release host must be reachable for.
  const checksums = resolveElectronChecksums(version, platform, arch)
  const archive = await packagingStep(process.env.DSH_DESKTOP_PACKAGING_RUN_DIR, 'download:electron',
    () => downloadArtifact({ version, platform, arch, artifactName: 'electron', cacheRoot: BUILD_PATHS.downloads,
      ...(checksums === undefined ? {} : { checksums }) }))
  rmSync(BUILD_PATHS.electron, { recursive: true, force: true })
  await packagingStep(process.env.DSH_DESKTOP_PACKAGING_RUN_DIR, 'extract:electron', () => extractZip(archive, { dir: BUILD_PATHS.electron }))
  const executable = join(BUILD_PATHS.electron, platform === 'win32' ? 'electron.exe' : 'Electron.app/Contents/MacOS/Electron')
  return execFileSync(executable, ['-p', 'process.versions.node'], {
    encoding: 'utf8', env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  }).trim()
}

function prepareCli({ platform, arch }: DesktopTarget): void {
  cpSync(join(import.meta.dirname, 'node-bin'), join(RUNTIME_ROOT, 'bin'), { recursive: true })
  chmodSync(join(RUNTIME_ROOT, 'bin', 'node'), 0o755)
  const cli = join(RUNTIME_ROOT, 'cli')
  prepareDesktopCli(cli, platform)
  if (platform === 'darwin') {
    const minimumVersion = execFileSync('/usr/libexec/PlistBuddy', [
      '-c', 'Print LSMinimumSystemVersion', join(BUILD_PATHS.electron, 'Electron.app', 'Contents', 'Info.plist'),
    ], { encoding: 'utf8' }).trim()
    prepareCommandLink(cli, arch, minimumVersion)
  }
  cpSync(join(import.meta.dirname, '..', 'lib', 'command-manager-entry.js'), join(cli, 'command-manager.js'))
  cpSync(join(import.meta.dirname, 'command-path.ps1'), join(cli, 'command-path.ps1'))
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { 'defer-primary-runtime-smoke': { type: 'boolean', default: false } } })
  const target = desktopTargetPlatform(resolveDesktopBuildTarget())
  rmSync(RUNTIME_ROOT, { recursive: true, force: true })
  mkdirSync(RUNTIME_ROOT, { recursive: true })
  const preparePrimary = () => packagingStep(process.env.DSH_DESKTOP_PACKAGING_RUN_DIR, 'prepare:primary-runtime',
    () => preparePrimaryRuntime({ deferSmoke: values['defer-primary-runtime-smoke'] }))
  let nodeVersion: string
  if (target.platform === 'win32') {
    const [electron, primary] = await Promise.allSettled([prepareElectron(target), preparePrimary()])
    if (electron.status === 'rejected') throw electron.reason
    if (primary.status === 'rejected') throw primary.reason
    nodeVersion = electron.value
  } else {
    nodeVersion = await prepareElectron(target)
    await preparePrimary()
  }
  const { pnpm } = await readPrimaryRuntime(join(RUNTIME_ROOT, 'primary-runtime'))
  if (pnpm === undefined) throw new Error('desktop runtime: primary-runtime manifest has no pnpm version')
  await packagingStep(process.env.DSH_DESKTOP_PACKAGING_RUN_DIR, 'prepare:cli', async () => { prepareCli(target) })
  writeFileSync(join(RUNTIME_ROOT, 'versions.json'), `${JSON.stringify({
    schemaVersion: 1,
    node: nodeVersion,
    pnpm,
  }, undefined, 2)}\n`)
}

await main()
