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
