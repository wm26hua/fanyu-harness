import { describe, expect, it } from 'vitest'
import { resolveLinuxPackageSettings } from '../scripts/linux-package-settings.mjs'

describe('desktop Linux package settings', () => {
  it('defaults the workspace tarball worker limit to four', () => {
    expect(resolveLinuxPackageSettings({})).toEqual({ packConcurrency: 4 })
    expect(resolveLinuxPackageSettings({ DSH_DESKTOP_LINUX_PACK_CONCURRENCY: '1' })).toEqual({ packConcurrency: 1 })
  })

  it.each(['9', '0', 'many', '', '-1', ' 4 '])('rejects the out-of-range or unparsable limit %j', (value) => {
    expect(() => resolveLinuxPackageSettings({ DSH_DESKTOP_LINUX_PACK_CONCURRENCY: value }))
      .toThrow(/DSH_DESKTOP_LINUX_PACK_CONCURRENCY must be an integer from 1 to 8/u)
  })

  it('accepts every limit the packaging run may pass to the tarball workers', () => {
    for (const value of ['1', '2', '3', '4', '5', '6', '7', '8']) {
      expect(resolveLinuxPackageSettings({ DSH_DESKTOP_LINUX_PACK_CONCURRENCY: value }).packConcurrency).toBe(Number(value))
    }
  })
})
