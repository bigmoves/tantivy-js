# tantivy-js Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a universal JavaScript library that wraps tantivy (Rust full-text search engine) via WebAssembly, exposing a direct binding API for both browser and Node.js environments.

**Architecture:** Rust crate with wasm-bindgen exports compiles to WASM. Thin JavaScript layer loads WASM and re-exports types with JSDoc documentation. Index data lives in WASM memory with serialize/load for persistence.

**Tech Stack:** Rust + wasm-bindgen + wasm-opt, JavaScript + JSDoc, TypeScript (types only), Vitest, oxlint

---

## Task 1: Initialize Project Structure

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.js`
- Create: `.gitignore`
- Create: `crates/tantivy-js-core/Cargo.toml`
- Create: `Cargo.toml` (workspace root)

**Step 1: Initialize git repository**

Run: `git init`
Expected: Initialized empty Git repository

**Step 2: Create package.json**

```json
{
  "name": "tantivy-js",
  "version": "0.1.0",
  "description": "Full-text search powered by tantivy, compiled to WebAssembly",
  "type": "module",
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./src/index.js"
    }
  },
  "files": [
    "src",
    "pkg",
    "types"
  ],
  "scripts": {
    "build": "node scripts/build.js",
    "build:wasm": "cargo build --target wasm32-unknown-unknown --release -p tantivy-js-core",
    "test": "vitest",
    "lint": "oxlint src test",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "search",
    "tantivy",
    "full-text",
    "wasm",
    "webassembly"
  ],
  "license": "MIT",
  "devDependencies": {
    "oxlint": "^0.16.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "checkJs": true,
    "allowJs": true,
    "strict": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "./types",
    "skipLibCheck": true
  },
  "include": ["src/**/*.js"]
}
```

**Step 4: Create vitest.config.js**

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    environment: 'node',
  },
});
```

**Step 5: Create .gitignore**

```
node_modules/
pkg/
types/
target/
*.wasm
.DS_Store
```

**Step 6: Create Cargo workspace root**

```toml
# Cargo.toml
[workspace]
members = ["crates/tantivy-js-core"]
resolver = "2"
```

**Step 7: Create Rust crate Cargo.toml**

```toml
# crates/tantivy-js-core/Cargo.toml
[package]
name = "tantivy-js-core"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
tantivy = "0.22"
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde-wasm-bindgen = "0.6"

[profile.release]
opt-level = "s"
lto = true
```

**Step 8: Install npm dependencies**

Run: `npm install`
Expected: Packages installed successfully

**Step 9: Commit**

```bash
git add -A
git commit -m "chore: initialize project structure

- Set up npm package with ESM exports
- Configure TypeScript for JSDoc type checking
- Configure Vitest for testing
- Set up Cargo workspace for Rust WASM crate"
```

---

## Task 2: Implement Rust Schema Bindings

**Files:**
- Create: `crates/tantivy-js-core/src/lib.rs`
- Create: `crates/tantivy-js-core/src/schema.rs`

**Step 1: Create lib.rs entry point**

```rust
// crates/tantivy-js-core/src/lib.rs
mod schema;

pub use schema::*;
```

**Step 2: Create schema.rs with SchemaBuilder**

```rust
// crates/tantivy-js-core/src/schema.rs
use wasm_bindgen::prelude::*;
use tantivy::schema::{
    Schema as TantivySchema,
    SchemaBuilder as TantivySchemaBuilder,
    TextFieldIndexing, TextOptions, IntOptions, BytesOptions,
    STORED, TEXT, STRING, INDEXED, FAST,
};

#[wasm_bindgen]
pub struct Schema {
    inner: TantivySchema,
}

#[wasm_bindgen]
impl Schema {
    pub fn to_json(&self) -> String {
        serde_json::to_string(&self.inner).unwrap_or_default()
    }

    pub fn num_fields(&self) -> usize {
        self.inner.fields().count()
    }
}

impl Schema {
    pub fn inner(&self) -> &TantivySchema {
        &self.inner
    }
}

#[wasm_bindgen]
pub struct SchemaBuilder {
    inner: TantivySchemaBuilder,
}

#[wasm_bindgen]
impl SchemaBuilder {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: TantivySchemaBuilder::new(),
        }
    }

    #[wasm_bindgen(js_name = addTextField)]
    pub fn add_text_field(&mut self, name: &str, stored: bool, indexed: bool) -> u32 {
        let mut opts = TextOptions::default();
        if stored {
            opts = opts | STORED;
        }
        if indexed {
            opts = opts | TEXT;
        }
        self.inner.add_text_field(name, opts).0
    }

    #[wasm_bindgen(js_name = addI64Field)]
    pub fn add_i64_field(&mut self, name: &str, stored: bool, indexed: bool, fast: bool) -> u32 {
        let mut opts = IntOptions::default();
        if stored {
            opts = opts.set_stored();
        }
        if indexed {
            opts = opts.set_indexed();
        }
        if fast {
            opts = opts.set_fast();
        }
        self.inner.add_i64_field(name, opts).0
    }

    #[wasm_bindgen(js_name = addF64Field)]
    pub fn add_f64_field(&mut self, name: &str, stored: bool, indexed: bool, fast: bool) -> u32 {
        let mut opts = IntOptions::default();
        if stored {
            opts = opts.set_stored();
        }
        if indexed {
            opts = opts.set_indexed();
        }
        if fast {
            opts = opts.set_fast();
        }
        self.inner.add_f64_field(name, opts).0
    }

    #[wasm_bindgen(js_name = addBytesField)]
    pub fn add_bytes_field(&mut self, name: &str, stored: bool, indexed: bool, fast: bool) -> u32 {
        let mut opts = BytesOptions::default();
        if stored {
            opts = opts.set_stored();
        }
        if indexed {
            opts = opts.set_indexed();
        }
        if fast {
            opts = opts.set_fast();
        }
        self.inner.add_bytes_field(name, opts).0
    }

    pub fn build(self) -> Schema {
        Schema {
            inner: self.inner.build(),
        }
    }
}

impl Default for SchemaBuilder {
    fn default() -> Self {
        Self::new()
    }
}
```

**Step 3: Verify Rust compiles**

Run: `cargo check -p tantivy-js-core`
Expected: Compiles without errors

**Step 4: Commit**

```bash
git add crates/
git commit -m "feat: add Rust schema bindings

- SchemaBuilder with text, i64, f64, bytes field support
- Schema wrapper with JSON serialization
- wasm-bindgen exports for JS interop"
```

---

## Task 3: Implement Rust Index and IndexWriter Bindings

**Files:**
- Modify: `crates/tantivy-js-core/src/lib.rs`
- Create: `crates/tantivy-js-core/src/index.rs`

**Step 1: Update lib.rs to include index module**

```rust
// crates/tantivy-js-core/src/lib.rs
mod schema;
mod index;

pub use schema::*;
pub use index::*;
```

**Step 2: Create index.rs with Index and IndexWriter**

```rust
// crates/tantivy-js-core/src/index.rs
use wasm_bindgen::prelude::*;
use tantivy::{
    Index as TantivyIndex,
    IndexWriter as TantivyIndexWriter,
    TantivyDocument,
    directory::RamDirectory,
    schema::Field,
};
use crate::schema::Schema;
use std::sync::{Arc, Mutex};

#[wasm_bindgen]
pub struct Index {
    inner: TantivyIndex,
}

#[wasm_bindgen]
impl Index {
    #[wasm_bindgen(constructor)]
    pub fn create(schema: &Schema) -> Result<Index, JsError> {
        let dir = RamDirectory::create();
        let index = TantivyIndex::create(dir, schema.inner().clone())
            .map_err(|e| JsError::new(&e.to_string()))?;
        Ok(Index { inner: index })
    }

    pub fn writer(&self, heap_size: Option<usize>) -> Result<IndexWriter, JsError> {
        let heap = heap_size.unwrap_or(50_000_000); // 50MB default
        let writer = self.inner.writer(heap)
            .map_err(|e| JsError::new(&e.to_string()))?;
        Ok(IndexWriter {
            inner: Arc::new(Mutex::new(Some(writer))),
            schema: self.inner.schema(),
        })
    }

    pub fn schema_json(&self) -> String {
        serde_json::to_string(&self.inner.schema()).unwrap_or_default()
    }
}

impl Index {
    pub fn inner(&self) -> &TantivyIndex {
        &self.inner
    }
}

#[wasm_bindgen]
pub struct IndexWriter {
    inner: Arc<Mutex<Option<TantivyIndexWriter>>>,
    schema: tantivy::schema::Schema,
}

#[wasm_bindgen]
impl IndexWriter {
    #[wasm_bindgen(js_name = addDocument)]
    pub fn add_document(&mut self, doc_json: &str) -> Result<(), JsError> {
        let json_value: serde_json::Value = serde_json::from_str(doc_json)
            .map_err(|e| JsError::new(&format!("Invalid JSON: {}", e)))?;

        let mut doc = TantivyDocument::new();

        if let serde_json::Value::Object(map) = json_value {
            for (field_name, value) in map {
                if let Some(field) = self.schema.get_field(&field_name).ok() {
                    match value {
                        serde_json::Value::String(s) => {
                            doc.add_text(field, &s);
                        }
                        serde_json::Value::Number(n) => {
                            if let Some(i) = n.as_i64() {
                                doc.add_i64(field, i);
                            } else if let Some(f) = n.as_f64() {
                                doc.add_f64(field, f);
                            }
                        }
                        _ => {}
                    }
                }
            }
        }

        let mut guard = self.inner.lock().map_err(|e| JsError::new(&e.to_string()))?;
        if let Some(ref mut writer) = *guard {
            writer.add_document(doc).map_err(|e| JsError::new(&e.to_string()))?;
        }
        Ok(())
    }

    pub fn commit(&mut self) -> Result<u64, JsError> {
        let mut guard = self.inner.lock().map_err(|e| JsError::new(&e.to_string()))?;
        if let Some(ref mut writer) = *guard {
            let opstamp = writer.commit().map_err(|e| JsError::new(&e.to_string()))?;
            return Ok(opstamp);
        }
        Err(JsError::new("Writer not available"))
    }

    #[wasm_bindgen(js_name = deleteByTerm)]
    pub fn delete_by_term(&mut self, field_name: &str, term: &str) -> Result<(), JsError> {
        let field = self.schema.get_field(field_name)
            .map_err(|_| JsError::new(&format!("Field '{}' not found", field_name)))?;

        let mut guard = self.inner.lock().map_err(|e| JsError::new(&e.to_string()))?;
        if let Some(ref mut writer) = *guard {
            let term = tantivy::Term::from_field_text(field, term);
            writer.delete_term(term);
        }
        Ok(())
    }
}
```

**Step 3: Verify Rust compiles**

Run: `cargo check -p tantivy-js-core`
Expected: Compiles without errors

**Step 4: Commit**

```bash
git add crates/
git commit -m "feat: add Index and IndexWriter bindings

- Index creation with in-memory RamDirectory
- IndexWriter with addDocument, commit, deleteByTerm
- JSON-based document input for flexibility"
```

---

## Task 4: Implement Rust Searcher and QueryParser Bindings

**Files:**
- Modify: `crates/tantivy-js-core/src/lib.rs`
- Create: `crates/tantivy-js-core/src/search.rs`

**Step 1: Update lib.rs to include search module**

```rust
// crates/tantivy-js-core/src/lib.rs
mod schema;
mod index;
mod search;

pub use schema::*;
pub use index::*;
pub use search::*;
```

**Step 2: Create search.rs with Searcher and QueryParser**

```rust
// crates/tantivy-js-core/src/search.rs
use wasm_bindgen::prelude::*;
use tantivy::{
    query::QueryParser as TantivyQueryParser,
    collector::TopDocs,
    ReloadPolicy,
    TantivyDocument,
    schema::Value,
};
use crate::index::Index;

#[wasm_bindgen]
pub struct Searcher {
    inner: tantivy::Searcher,
    schema: tantivy::schema::Schema,
}

#[wasm_bindgen]
impl Searcher {
    pub fn search(&self, query_str: &str, limit: usize, fields_json: &str) -> Result<String, JsError> {
        // Parse field names for query parser
        let field_names: Vec<String> = serde_json::from_str(fields_json)
            .map_err(|e| JsError::new(&format!("Invalid fields JSON: {}", e)))?;

        let fields: Vec<tantivy::schema::Field> = field_names
            .iter()
            .filter_map(|name| self.schema.get_field(name).ok())
            .collect();

        if fields.is_empty() {
            return Err(JsError::new("No valid fields provided for search"));
        }

        let query_parser = TantivyQueryParser::for_index(
            &tantivy::Index::create_in_ram(self.schema.clone()),
            fields,
        );

        let query = query_parser.parse_query(query_str)
            .map_err(|e| JsError::new(&format!("Query parse error: {}", e)))?;

        let top_docs = self.inner.search(&query, &TopDocs::with_limit(limit))
            .map_err(|e| JsError::new(&format!("Search error: {}", e)))?;

        let mut results = Vec::new();
        for (_score, doc_address) in top_docs {
            let doc: TantivyDocument = self.inner.doc(doc_address)
                .map_err(|e| JsError::new(&format!("Doc retrieval error: {}", e)))?;

            let mut doc_map = serde_json::Map::new();
            for (field, field_entry) in self.schema.fields() {
                let field_name = field_entry.name();
                for value in doc.get_all(field) {
                    match value {
                        Value::Str(s) => {
                            doc_map.insert(field_name.to_string(), serde_json::Value::String(s.to_string()));
                        }
                        Value::I64(i) => {
                            doc_map.insert(field_name.to_string(), serde_json::Value::Number((*i).into()));
                        }
                        Value::F64(f) => {
                            if let Some(n) = serde_json::Number::from_f64(*f) {
                                doc_map.insert(field_name.to_string(), serde_json::Value::Number(n));
                            }
                        }
                        _ => {}
                    }
                }
            }
            results.push(serde_json::Value::Object(doc_map));
        }

        serde_json::to_string(&results)
            .map_err(|e| JsError::new(&format!("JSON serialize error: {}", e)))
    }
}

#[wasm_bindgen]
impl Index {
    pub fn searcher(&self) -> Result<Searcher, JsError> {
        let reader = self.inner()
            .reader_builder()
            .reload_policy(ReloadPolicy::Manual)
            .try_into()
            .map_err(|e: tantivy::TantivyError| JsError::new(&e.to_string()))?;

        Ok(Searcher {
            inner: reader.searcher(),
            schema: self.inner().schema(),
        })
    }
}
```

**Step 3: Verify Rust compiles**

Run: `cargo check -p tantivy-js-core`
Expected: Compiles without errors

**Step 4: Commit**

```bash
git add crates/
git commit -m "feat: add Searcher and query support

- Searcher with search method returning JSON results
- QueryParser integration for query string parsing
- Support for term, phrase, and boolean queries"
```

---

## Task 5: Build WASM and Create Build Script

**Files:**
- Create: `scripts/build.js`
- Create: `src/` directory structure

**Step 1: Create scripts directory and build.js**

```javascript
// scripts/build.js
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';

const run = (cmd, desc) => {
  console.log(`\n> ${desc || cmd}`);
  execSync(cmd, { stdio: 'inherit' });
};

// Ensure pkg directory exists
if (!existsSync('./pkg')) {
  mkdirSync('./pkg', { recursive: true });
}

// 1. Build Rust → WASM
run(
  'cargo build --target wasm32-unknown-unknown --release -p tantivy-js-core',
  'Building Rust to WASM...'
);

// 2. Generate JS bindings
run(
  'wasm-bindgen --target web --out-dir ./pkg ./target/wasm32-unknown-unknown/release/tantivy_js_core.wasm',
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
```

**Step 2: Test the build script runs (may fail if Rust not set up)**

Run: `node scripts/build.js`
Expected: Either builds successfully or fails with clear Rust/wasm-bindgen setup instructions

**Step 3: Commit**

```bash
git add scripts/
git commit -m "feat: add build script

- Orchestrates cargo build, wasm-bindgen, wasm-opt, tsc
- Graceful fallback if wasm-opt not installed"
```

---

## Task 6: Create JavaScript Wrapper - Loader

**Files:**
- Create: `src/loader.js`

**Step 1: Create the WASM loader module**

```javascript
// src/loader.js

/**
 * @typedef {typeof import('../pkg/tantivy_js_core.js')} WasmModule
 */

/** @type {WasmModule | null} */
let wasmModule = null;

/** @type {Promise<WasmModule> | null} */
let initPromise = null;

/**
 * Initialize the WASM module. Safe to call multiple times.
 * @returns {Promise<WasmModule>}
 */
export async function init() {
  if (wasmModule) return wasmModule;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const wasm = await import('../pkg/tantivy_js_core.js');
    await wasm.default();
    wasmModule = wasm;
    return wasm;
  })();

  return initPromise;
}

/**
 * Get the initialized WASM module.
 * @returns {WasmModule}
 * @throws {Error} if init() hasn't been called
 */
export function getModule() {
  if (!wasmModule) {
    throw new Error('tantivy-js not initialized. Call init() first.');
  }
  return wasmModule;
}

/**
 * Check if the module is initialized.
 * @returns {boolean}
 */
export function isInitialized() {
  return wasmModule !== null;
}
```

**Step 2: Commit**

```bash
git add src/
git commit -m "feat: add WASM loader module

- Lazy initialization with init()
- Singleton pattern prevents double-loading
- getModule() for synchronous access after init"
```

---

## Task 7: Create JavaScript Wrapper - Schema

**Files:**
- Create: `src/schema.js`

**Step 1: Create the schema wrapper**

```javascript
// src/schema.js
import { getModule } from './loader.js';

/**
 * @typedef {Object} TextFieldOptions
 * @property {boolean} [stored=false] - Store field value for retrieval
 * @property {boolean} [indexed=true] - Index field for searching
 */

/**
 * @typedef {Object} NumericFieldOptions
 * @property {boolean} [stored=false] - Store field value for retrieval
 * @property {boolean} [indexed=true] - Index field for searching
 * @property {boolean} [fast=false] - Enable fast field for sorting/aggregation
 */

/**
 * Schema definition for an index.
 */
export class Schema {
  /** @type {import('../pkg/tantivy_js_core.js').Schema} */
  #inner;

  /**
   * @param {import('../pkg/tantivy_js_core.js').Schema} inner
   * @internal
   */
  constructor(inner) {
    this.#inner = inner;
  }

  /**
   * Get the number of fields in the schema.
   * @returns {number}
   */
  numFields() {
    return this.#inner.num_fields();
  }

  /**
   * Get the schema as JSON.
   * @returns {string}
   */
  toJSON() {
    return this.#inner.to_json();
  }

  /**
   * @internal
   */
  get _inner() {
    return this.#inner;
  }
}

/**
 * Builder for creating index schemas.
 */
export class SchemaBuilder {
  /** @type {import('../pkg/tantivy_js_core.js').SchemaBuilder} */
  #inner;

  constructor() {
    const mod = getModule();
    this.#inner = new mod.SchemaBuilder();
  }

  /**
   * Add a text field to the schema.
   * @param {string} name - Field name
   * @param {TextFieldOptions} [options={}]
   * @returns {this}
   */
  addTextField(name, options = {}) {
    const stored = options.stored ?? false;
    const indexed = options.indexed ?? true;
    this.#inner.addTextField(name, stored, indexed);
    return this;
  }

  /**
   * Add an i64 (integer) field to the schema.
   * @param {string} name - Field name
   * @param {NumericFieldOptions} [options={}]
   * @returns {this}
   */
  addI64Field(name, options = {}) {
    const stored = options.stored ?? false;
    const indexed = options.indexed ?? true;
    const fast = options.fast ?? false;
    this.#inner.addI64Field(name, stored, indexed, fast);
    return this;
  }

  /**
   * Add an f64 (float) field to the schema.
   * @param {string} name - Field name
   * @param {NumericFieldOptions} [options={}]
   * @returns {this}
   */
  addF64Field(name, options = {}) {
    const stored = options.stored ?? false;
    const indexed = options.indexed ?? true;
    const fast = options.fast ?? false;
    this.#inner.addF64Field(name, stored, indexed, fast);
    return this;
  }

  /**
   * Add a bytes field to the schema.
   * @param {string} name - Field name
   * @param {NumericFieldOptions} [options={}]
   * @returns {this}
   */
  addBytesField(name, options = {}) {
    const stored = options.stored ?? false;
    const indexed = options.indexed ?? true;
    const fast = options.fast ?? false;
    this.#inner.addBytesField(name, stored, indexed, fast);
    return this;
  }

  /**
   * Build the schema.
   * @returns {Schema}
   */
  build() {
    return new Schema(this.#inner.build());
  }
}
```

**Step 2: Commit**

```bash
git add src/schema.js
git commit -m "feat: add Schema and SchemaBuilder JS wrappers

- Fluent builder API with method chaining
- JSDoc types for editor support
- Options objects for field configuration"
```

---

## Task 8: Create JavaScript Wrapper - Index and IndexWriter

**Files:**
- Create: `src/index-writer.js`

**Step 1: Create the index and writer wrappers**

```javascript
// src/index-writer.js
import { getModule } from './loader.js';
import { Schema } from './schema.js';

/**
 * A tantivy search index.
 */
export class Index {
  /** @type {import('../pkg/tantivy_js_core.js').Index} */
  #inner;

  /**
   * @param {import('../pkg/tantivy_js_core.js').Index} inner
   * @internal
   */
  constructor(inner) {
    this.#inner = inner;
  }

  /**
   * Create a new in-memory index with the given schema.
   * @param {Schema} schema
   * @returns {Index}
   */
  static create(schema) {
    const mod = getModule();
    const inner = new mod.Index(schema._inner);
    return new Index(inner);
  }

  /**
   * Get an IndexWriter for adding documents.
   * @param {number} [heapSize=50_000_000] - Writer heap size in bytes
   * @returns {IndexWriter}
   */
  writer(heapSize) {
    const inner = this.#inner.writer(heapSize);
    return new IndexWriter(inner);
  }

  /**
   * Get a Searcher for querying the index.
   * @returns {import('./searcher.js').Searcher}
   */
  searcher() {
    // Lazy import to avoid circular dependency
    const { Searcher } = require('./searcher.js');
    const inner = this.#inner.searcher();
    return new Searcher(inner);
  }

  /**
   * Get the schema as JSON.
   * @returns {string}
   */
  schemaJSON() {
    return this.#inner.schema_json();
  }

  /**
   * @internal
   */
  get _inner() {
    return this.#inner;
  }
}

/**
 * Writer for adding, updating, and deleting documents.
 */
export class IndexWriter {
  /** @type {import('../pkg/tantivy_js_core.js').IndexWriter} */
  #inner;

  /**
   * @param {import('../pkg/tantivy_js_core.js').IndexWriter} inner
   * @internal
   */
  constructor(inner) {
    this.#inner = inner;
  }

  /**
   * Add a document to the index.
   * @param {Record<string, string | number>} doc - Document fields
   * @returns {this}
   */
  addDocument(doc) {
    this.#inner.addDocument(JSON.stringify(doc));
    return this;
  }

  /**
   * Delete documents matching a term.
   * @param {string} field - Field name
   * @param {string} term - Term to match
   * @returns {this}
   */
  deleteByTerm(field, term) {
    this.#inner.deleteByTerm(field, term);
    return this;
  }

  /**
   * Commit all pending changes to the index.
   * @returns {bigint} Operation stamp
   */
  commit() {
    return this.#inner.commit();
  }
}
```

**Step 2: Commit**

```bash
git add src/index-writer.js
git commit -m "feat: add Index and IndexWriter JS wrappers

- Index.create() factory method
- IndexWriter with addDocument, deleteByTerm, commit
- Documents passed as plain JS objects"
```

---

## Task 9: Create JavaScript Wrapper - Searcher

**Files:**
- Create: `src/searcher.js`

**Step 1: Create the searcher wrapper**

```javascript
// src/searcher.js

/**
 * @typedef {Object} SearchOptions
 * @property {number} [limit=10] - Maximum results to return
 */

/**
 * Searcher for querying an index.
 */
export class Searcher {
  /** @type {import('../pkg/tantivy_js_core.js').Searcher} */
  #inner;

  /**
   * @param {import('../pkg/tantivy_js_core.js').Searcher} inner
   * @internal
   */
  constructor(inner) {
    this.#inner = inner;
  }

  /**
   * Search the index.
   * @param {string} query - Query string (supports term, phrase, boolean syntax)
   * @param {string[]} fields - Fields to search in
   * @param {SearchOptions} [options={}]
   * @returns {Array<Record<string, unknown>>} Matching documents
   */
  search(query, fields, options = {}) {
    const limit = options.limit ?? 10;
    const fieldsJson = JSON.stringify(fields);
    const resultsJson = this.#inner.search(query, limit, fieldsJson);
    return JSON.parse(resultsJson);
  }
}
```

**Step 2: Commit**

```bash
git add src/searcher.js
git commit -m "feat: add Searcher JS wrapper

- search() method with query string and field selection
- Results returned as plain JS objects"
```

---

## Task 10: Create Main Entry Point

**Files:**
- Create: `src/index.js`
- Modify: `src/index-writer.js` (fix circular import)

**Step 1: Fix circular import in index-writer.js**

Replace the `searcher()` method in `src/index-writer.js`:

```javascript
  /**
   * Get a Searcher for querying the index.
   * @returns {Searcher}
   */
  searcher() {
    const { Searcher } = await import('./searcher.js');
    const inner = this.#inner.searcher();
    return new Searcher(inner);
  }
```

Actually, simpler approach - make it synchronous by importing at top. Update `src/index-writer.js` to add import at top:

```javascript
// src/index-writer.js
import { getModule } from './loader.js';
import { Schema } from './schema.js';
import { Searcher } from './searcher.js';
```

And update the `searcher()` method:

```javascript
  /**
   * Get a Searcher for querying the index.
   * @returns {Searcher}
   */
  searcher() {
    const inner = this.#inner.searcher();
    return new Searcher(inner);
  }
```

**Step 2: Create main entry point**

```javascript
// src/index.js
export { init, isInitialized } from './loader.js';
export { Schema, SchemaBuilder } from './schema.js';
export { Index, IndexWriter } from './index-writer.js';
export { Searcher } from './searcher.js';
```

**Step 3: Commit**

```bash
git add src/
git commit -m "feat: add main entry point

- Re-export all public APIs from src/index.js
- Fix circular import between index-writer and searcher"
```

---

## Task 11: Write Tests - Schema

**Files:**
- Create: `test/schema.test.js`

**Step 1: Create schema tests**

```javascript
// test/schema.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { init, SchemaBuilder } from '../src/index.js';

describe('SchemaBuilder', () => {
  beforeAll(async () => {
    await init();
  });

  it('creates an empty schema', () => {
    const schema = new SchemaBuilder().build();
    expect(schema.numFields()).toBe(0);
  });

  it('creates a schema with a text field', () => {
    const schema = new SchemaBuilder()
      .addTextField('title', { stored: true })
      .build();

    expect(schema.numFields()).toBe(1);
  });

  it('creates a schema with multiple field types', () => {
    const schema = new SchemaBuilder()
      .addTextField('title', { stored: true, indexed: true })
      .addTextField('body', { stored: true })
      .addI64Field('year', { stored: true, indexed: true })
      .addF64Field('rating', { stored: true, fast: true })
      .build();

    expect(schema.numFields()).toBe(4);
  });

  it('supports method chaining', () => {
    const builder = new SchemaBuilder();
    const result = builder.addTextField('a');
    expect(result).toBe(builder);
  });
});
```

**Step 2: Run tests (expected to fail - no WASM yet)**

Run: `npm test`
Expected: FAIL (WASM module not found)

**Step 3: Commit**

```bash
git add test/
git commit -m "test: add schema tests

- Test empty schema, single field, multiple field types
- Test method chaining behavior"
```

---

## Task 12: Write Tests - Index and Search

**Files:**
- Create: `test/index.test.js`

**Step 1: Create index and search tests**

```javascript
// test/index.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import { init, SchemaBuilder, Index } from '../src/index.js';

describe('Index', () => {
  beforeAll(async () => {
    await init();
  });

  it('creates an index', () => {
    const schema = new SchemaBuilder()
      .addTextField('title', { stored: true })
      .build();

    const index = Index.create(schema);
    expect(index).toBeDefined();
  });

  it('indexes and searches documents', () => {
    const schema = new SchemaBuilder()
      .addTextField('title', { stored: true, indexed: true })
      .addTextField('body', { stored: true, indexed: true })
      .build();

    const index = Index.create(schema);
    const writer = index.writer();

    writer.addDocument({ title: 'Hello World', body: 'This is a test document' });
    writer.addDocument({ title: 'Goodbye World', body: 'Another test document' });
    writer.addDocument({ title: 'Hello Again', body: 'Yet another document' });
    writer.commit();

    const searcher = index.searcher();
    const results = searcher.search('hello', ['title'], { limit: 10 });

    expect(results).toHaveLength(2);
    expect(results.map(r => r.title)).toContain('Hello World');
    expect(results.map(r => r.title)).toContain('Hello Again');
  });

  it('supports phrase queries', () => {
    const schema = new SchemaBuilder()
      .addTextField('content', { stored: true, indexed: true })
      .build();

    const index = Index.create(schema);
    const writer = index.writer();

    writer.addDocument({ content: 'the quick brown fox' });
    writer.addDocument({ content: 'the quick red fox' });
    writer.addDocument({ content: 'brown fox quick' });
    writer.commit();

    const searcher = index.searcher();
    const results = searcher.search('"quick brown"', ['content'], { limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('the quick brown fox');
  });

  it('supports boolean queries', () => {
    const schema = new SchemaBuilder()
      .addTextField('title', { stored: true, indexed: true })
      .build();

    const index = Index.create(schema);
    const writer = index.writer();

    writer.addDocument({ title: 'rust programming' });
    writer.addDocument({ title: 'rust language' });
    writer.addDocument({ title: 'javascript programming' });
    writer.commit();

    const searcher = index.searcher();
    const results = searcher.search('rust AND programming', ['title'], { limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('rust programming');
  });

  it('deletes documents by term', () => {
    const schema = new SchemaBuilder()
      .addTextField('id', { stored: true, indexed: true })
      .addTextField('title', { stored: true, indexed: true })
      .build();

    const index = Index.create(schema);
    const writer = index.writer();

    writer.addDocument({ id: '1', title: 'First' });
    writer.addDocument({ id: '2', title: 'Second' });
    writer.commit();

    writer.deleteByTerm('id', '1');
    writer.commit();

    const searcher = index.searcher();
    const results = searcher.search('*', ['title'], { limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Second');
  });
});
```

**Step 2: Run tests (expected to fail - no WASM yet)**

Run: `npm test`
Expected: FAIL (WASM module not found)

**Step 3: Commit**

```bash
git add test/
git commit -m "test: add index and search tests

- Test index creation, document indexing
- Test term, phrase, and boolean queries
- Test document deletion"
```

---

## Task 13: Create README

**Files:**
- Create: `README.md`

**Step 1: Create README**

```markdown
# tantivy-js

Full-text search powered by [tantivy](https://github.com/quickwit-oss/tantivy), compiled to WebAssembly. Works in both Node.js and browsers.

## Installation

```bash
npm install tantivy-js
```

## Usage

```javascript
import { init, SchemaBuilder, Index } from 'tantivy-js';

// Initialize WASM (call once at startup)
await init();

// Define schema
const schema = new SchemaBuilder()
  .addTextField('title', { stored: true, indexed: true })
  .addTextField('body', { stored: true, indexed: true })
  .addI64Field('year', { stored: true })
  .build();

// Create index
const index = Index.create(schema);

// Add documents
const writer = index.writer();
writer.addDocument({ title: 'Rust Programming', body: 'Learn Rust basics', year: 2024 });
writer.addDocument({ title: 'JavaScript Guide', body: 'Modern JS patterns', year: 2023 });
writer.commit();

// Search
const searcher = index.searcher();
const results = searcher.search('rust', ['title', 'body'], { limit: 10 });
console.log(results);
// [{ title: 'Rust Programming', body: 'Learn Rust basics', year: 2024 }]
```

## Query Syntax

tantivy-js supports the standard tantivy query syntax:

- **Terms:** `rust` - matches documents containing "rust"
- **Phrases:** `"hello world"` - matches exact phrase
- **Boolean:** `rust AND programming`, `rust OR javascript`, `rust NOT beginner`
- **Field-specific:** `title:rust` - search only in title field

## API

### `init(): Promise<void>`

Initialize the WASM module. Call once before using other APIs.

### `SchemaBuilder`

- `addTextField(name, options?)` - Add a text field
- `addI64Field(name, options?)` - Add an integer field
- `addF64Field(name, options?)` - Add a float field
- `addBytesField(name, options?)` - Add a bytes field
- `build()` - Build the schema

Field options:
- `stored: boolean` - Store value for retrieval (default: false)
- `indexed: boolean` - Index for searching (default: true)
- `fast: boolean` - Enable fast field (numeric only, default: false)

### `Index`

- `Index.create(schema)` - Create a new in-memory index
- `writer(heapSize?)` - Get an IndexWriter
- `searcher()` - Get a Searcher

### `IndexWriter`

- `addDocument(doc)` - Add a document (plain JS object)
- `deleteByTerm(field, term)` - Delete documents matching term
- `commit()` - Commit pending changes

### `Searcher`

- `search(query, fields, options?)` - Search the index

## Building from Source

Requirements:
- Rust toolchain with `wasm32-unknown-unknown` target
- `wasm-bindgen-cli`
- `wasm-opt` (optional, for optimization)

```bash
# Install Rust WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-bindgen
cargo install wasm-bindgen-cli

# Build
npm run build
```

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage examples and API reference"
```

---

## Task 14: Full Build and Test Verification

**Step 1: Install Rust WASM target (if needed)**

Run: `rustup target add wasm32-unknown-unknown`
Expected: Target installed or already present

**Step 2: Install wasm-bindgen-cli (if needed)**

Run: `cargo install wasm-bindgen-cli`
Expected: Installed or already present

**Step 3: Run full build**

Run: `npm run build`
Expected: Build completes successfully, pkg/ directory populated

**Step 4: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 5: Run linter**

Run: `npm run lint`
Expected: No lint errors

**Step 6: Run type check**

Run: `npm run typecheck`
Expected: No type errors

**Step 7: Final commit**

```bash
git add -A
git commit -m "chore: verify build and tests pass"
```

---

## Summary

This plan creates a minimal but functional `tantivy-js` library with:

- **14 tasks** covering project setup through verification
- **TDD approach** - tests written before WASM is available
- **Frequent commits** - one logical change per commit
- **Core features:** schema definition, indexing, searching with term/phrase/boolean queries
- **Future expansion points:** custom tokenizers, facets, snippets, fuzzy search
