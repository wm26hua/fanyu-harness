/** Product identity shared by every Desktop artifact name, bundle path and launcher target. */

/** Product name electron-builder writes into the macOS bundle directory and the Windows executable. */
export const DESKTOP_PRODUCT_NAME: 'Fanyu harness'

/** Prefix of the artifact names electron-builder writes and every consumer looks up. */
export const DESKTOP_ARTIFACT_PREFIX: 'fanyu-harness'

/** Machine-facing short name: Windows executable, install directory, packaged manifest name and update cache. */
export const DESKTOP_EXECUTABLE_NAME: 'fyh'

/** Custom protocol scheme the installed application registers for `open` deep links. */
export const DESKTOP_PROTOCOL_SCHEME: 'fyh'
