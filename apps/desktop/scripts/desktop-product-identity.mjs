/** Product identity shared by every Desktop artifact name, bundle path and launcher target. */

/**
 * Product name electron-builder writes into the macOS bundle directory and the Windows executable.
 * A path that names either of those must use this value rather than a literal of its own.
 */
export const DESKTOP_PRODUCT_NAME = 'Fanyu harness'

/**
 * Prefix of the artifact names electron-builder writes and every consumer looks up.
 * It lives beside the product name so a rename cannot leave a producer and a consumer disagreeing
 * about the file it should have written.
 */
export const DESKTOP_ARTIFACT_PREFIX = 'fanyu-harness'

/**
 * Machine-facing short name of the installed application.
 *
 * It is the Windows executable and default installation directory (`%LOCALAPPDATA%\Programs\fyh`),
 * the packaged manifest `name` that Electron turns into the per-user application data directory
 * (`%APPDATA%\fyh`) and the update cache directory (`%LOCALAPPDATA%\fyh-updater`), and the Windows
 * uninstall data-removal target. It stays free of spaces so every derived path is shell-safe, and it
 * is deliberately not the display name: user-visible copy keeps `DESKTOP_PRODUCT_NAME`.
 */
export const DESKTOP_EXECUTABLE_NAME = 'fyh'

/**
 * Custom protocol scheme the installed application registers for `open` deep links.
 * A downstream release claims its own scheme so installing it beside the upstream build
 * cannot leave two applications competing for one registration.
 */
export const DESKTOP_PROTOCOL_SCHEME = 'fyh'
