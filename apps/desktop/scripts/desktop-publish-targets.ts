/** Approved packaging workflows and machine publication targets. */
import { z } from 'zod'

/** Each target is produced by its own manually dispatched workflow. */
export const desktopPackageWorkflows = {
  'mac-arm64': '.github/workflows/macos-package.yml',
  'mac-x64': '.github/workflows/macos-intel-package.yml',
  'win-x64': '.github/workflows/windows-package.yml',
} as const

const targetSchema = z.enum(['mac-arm64', 'mac-x64', 'win-x64'])

/** Fixed targets with a manual packaging workflow and a publication route. */
export type DesktopPublishTarget = z.infer<typeof targetSchema>

/**
 * Report whether a build target has a packaging workflow and a publication route.
 * @param target - Supported build target, which may be one that only packages locally.
 * @returns Whether the target can be routed to a publication machine.
 */
export function isDesktopPublishTarget(target: string): target is DesktopPublishTarget {
  return targetSchema.safeParse(target).success
}

/** Machine labels are unique; a scalar target is shorthand for a one-element target list. */
export const desktopPublishRunnersSchema = z.record(z.string(), z.object({
  label: z.string().regex(/^dsh-[a-z0-9-]+$/u),
  target: z.union([targetSchema, z.array(targetSchema).min(1)])
    .transform(value => typeof value === 'string' ? [value] : value),
}))
