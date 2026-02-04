// scripts/build.js
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';

const run = (cmd, desc, env = {}) => {
  console.log(`\n> ${desc || cmd}`);
  execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });
};

// Ensure pkg directory exists
if (!existsSync('./pkg')) {
  mkdirSync('./pkg', { recursive: true });
}

// Environment for WASM build - use LLVM clang with WASM support
const wasmEnv = {
  CC: '/opt/homebrew/opt/llvm/bin/clang',
  AR: '/opt/homebrew/opt/llvm/bin/llvm-ar',
  CFLAGS: '--target=wasm32-unknown-unknown',
};

// 1. Build Rust → WASM
run(
  'cargo build --target wasm32-unknown-unknown --release -p tantivy-js-core',
  'Building Rust to WASM...',
  wasmEnv
);

// 2. Generate JS bindings (nodejs target for Node.js compatibility)
run(
  'wasm-bindgen --target nodejs --out-dir ./pkg ./target/wasm32-unknown-unknown/release/tantivy_js_core.wasm',
  'Generating JS bindings...'
);

// 3. Optimize WASM binary (optional, requires wasm-opt)
try {
  run(
    'wasm-opt -O3 ./pkg/tantivy_js_core_bg.wasm -o ./pkg/tantivy_js_core_bg.wasm',
    'Optimizing WASM...'
  );
} catch {
  console.log('wasm-opt not found, skipping optimization');
}

// 4. Generate TypeScript declarations
run('tsc', 'Generating TypeScript declarations...');

console.log('\nBuild complete!');
