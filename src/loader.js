// src/loader.js
import { createRequire } from 'module';
import { platform, arch } from 'os';

const require = createRequire(import.meta.url);

/**
 * @typedef {import('../index.d.ts')} NativeModule
 */

/** @type {NativeModule} */
const nativeModule = require(`../tantivy-js-core.${platform()}-${arch()}.node`);

/**
 * Get the native module.
 * @returns {NativeModule}
 */
export function getModule() {
  return nativeModule;
}
