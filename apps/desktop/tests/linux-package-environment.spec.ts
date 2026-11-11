import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  loadDesktopPackageEnvironment,
  localLinuxPackageEnvironment,
  validateDesktopPackageEnvironment,
} from '../scripts/desktop-package-environment.mjs'
import { resolveLinuxPackageSettings } from '../scripts/linux-package-settings.mjs'

const LINUX = { platform: 'linux', arch: 'x64' } as const

async function withDirectory(action: (directory: string) => Promise<void>): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'desktop-linux-env-'))
  try {
    await action(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

describe('Desktop Linux packaging configuration', () => {
  it('selects the Linux defaults a local unsigned build needs and nothing else', () => {
    const selected = localLinuxPackageEnvironment({
      PATH: '/usr/bin',
      DSH_DESKTOP_APP_ID: 'com.ambient.override',
      DSH_DESKTOP_AUTO_UPDATE_ENV: 'production',
      DSH_DESKTOP_LINUX_PACK_CONCURRENCY: '2',
      DOWNLOAD_TEST_ORIGIN: 'https://updates.example.com',
      DSH_DESKTOP_MANDATORY_UPDATE_TEST_ORIGIN: 'https://policy.example.com',
      CSC_LINK: 'private.pfx',
      APPLE_API_KEY: 'private.p8',
    })
    expect(selected).toEqual({
      PATH: '/usr/bin',
      DSH_DESKTOP_APP_ID: 'com.fanyu.harness',
      DSH_DESKTOP_UNSIGNED: '1',
    })
  })

  it('validates a Linux unsigned build without an update origin or a signing credential', () => {
    const environment = localLinuxPackageEnvironment({})
    expect(() => validateDesktopPackageEnvironment(environment, LINUX, { unsigned: true })).not.toThrow()
    // The same environment cannot validate the signed Windows path, which does ship the policy.
    expect(() => validateDesktopPackageEnvironment(environment, { platform: 'win32', arch: 'x64' }, {}))
      .toThrow(/DSH_DESKTOP_MANDATORY_UPDATE_TEST_ORIGIN/u)
  })

  it('reads .env.linux and takes its worker limit from that file alone', async () => {
    await withDirectory(async (directory) => {
      await writeFile(join(directory, '.env.linux'), [
        'DSH_DESKTOP_APP_ID=com.fanyu.harness', 'DSH_DESKTOP_AUTO_UPDATE_ENV=test', 'DSH_DESKTOP_LINUX_PACK_CONCURRENCY=6', '',
      ].join('\n'))
      const selected = loadDesktopPackageEnvironment('linux', {}, directory)
      expect(selected.DSH_DESKTOP_APP_ID).toBe('com.fanyu.harness')
      expect(resolveLinuxPackageSettings(selected).packConcurrency).toBe(6)
    })
  })

  it('refuses a Windows-only setting in .env.linux instead of silently ignoring it', async () => {
    await withDirectory(async (directory) => {
      await writeFile(join(directory, '.env.linux'), 'DSH_DESKTOP_WINDOWS_COMPRESSION_LEVEL=7\n')
      expect(() => loadDesktopPackageEnvironment('linux', {}, directory))
        .toThrow(/unsupported setting DSH_DESKTOP_WINDOWS_COMPRESSION_LEVEL/u)
    })
  })

  it('names the missing Linux template when the release dotenv is absent', async () => {
    await withDirectory(async (directory) => {
      expect(() => loadDesktopPackageEnvironment('linux', {}, directory)).toThrow(/\.env\.linux\.example/u)
    })
  })
})
