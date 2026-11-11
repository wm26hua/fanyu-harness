/** Validate the assembled application, including native Office conversion outside ASAR. */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { DESKTOP_ARTIFACT_PREFIX, DESKTOP_PRODUCT_NAME } from './desktop-product-identity.mjs'
import { desktopArtifactOutput, resolveDesktopBuildTarget, resolveDesktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { readDesktopRuntime, verifyDesktopRuntime } from '../src/runtime-tree.ts'
import { verifyWindowsCode } from './windows-runtime-signature.mjs'
import { smokePreparedRuntime } from './smoke-prepared-runtime.ts'
import { resolveDesktopPackageTarget } from './package-target.ts'

const paths = resolveDesktopTargetBuildPaths()
const { values } = parseArgs({ options: {
  unsigned: { type: 'boolean', default: false },
  'skip-notarization': { type: 'boolean', default: false },
  'defer-runtime-smoke': { type: 'boolean', default: false },
}, allowPositionals: false })
const target = resolveDesktopBuildTarget()
const windows = target === 'win-x64'
const linux = target === 'linux-x64' || target === 'linux-arm64'
const artifacts = desktopArtifactOutput(paths, { unsigned: values.unsigned, skipNotarization: values['skip-notarization'] }).directory
// electron-builder names the x64 Linux tree linux-unpacked and every other architecture
// linux-<arch>-unpacked.
const linuxUnpacked = join(artifacts, `linux-${target === 'linux-arm64' ? 'arm64' : 'x64'}-unpacked`)
const application = windows ? join(artifacts, 'win-unpacked')
  : linux ? existsSync(linuxUnpacked) ? linuxUnpacked : join(artifacts, 'linux-unpacked')
    : join(artifacts, target === 'mac-arm64' ? 'mac-arm64' : 'mac', `${DESKTOP_PRODUCT_NAME}.app`, 'Contents')
const resources = join(application, windows || linux ? 'resources' : 'Resources')
const executable = windows ? join(application, `${DESKTOP_PRODUCT_NAME}.exe`)
  // electron-builder uses the configured Linux executable name, which is the artifact prefix.
  : linux ? join(application, DESKTOP_ARTIFACT_PREFIX)
    : join(application, 'MacOS', DESKTOP_PRODUCT_NAME)
const descriptor = await verifyDesktopRuntime(paths.dsh, readDesktopRuntime(paths.dsh).release.version,
  resolveDesktopPackageTarget(target))
if (windows && !values.unsigned) await verifyWindowsCode(application)
// A Linux package carries no LibreOffice Kit native modules, so its Office checks cannot pass.
// Skipping them keeps every other packaged-runtime failure fatal. The runtime payload lane is
// deferred only on an explicit request from a build host whose glib breaks Electron's libvips.
await smokePreparedRuntime(join(resources, 'app.asar', 'dsh'), executable, join(resources, 'runtime'), descriptor,
  linux, values['defer-runtime-smoke'])
