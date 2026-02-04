// src/index-writer.js
import { getModule } from './loader.js';
import { Searcher } from './searcher.js';

/**
 * A tantivy search index.
 */
export class Index {
  /** @type {import('../index.d.ts').Index} */
  #inner;

  /**
   * @param {import('../index.d.ts').Index} inner
   * @internal
   */
  constructor(inner) {
    this.#inner = inner;
  }

  /**
   * Create a new in-memory index with the given schema.
   * @param {import('./schema.js').Schema} schema
   * @returns {Index}
   */
  static create(schema) {
    const mod = getModule();
    const inner = mod.Index.create(schema._inner);
    return new Index(inner);
  }

  /**
   * Open or create a persistent index at the given path.
   * @param {string} path - Directory path for the index
   * @param {import('./schema.js').Schema} schema
   * @returns {Index}
   */
  static open(path, schema) {
    const mod = getModule();
    const inner = mod.Index.open(path, schema._inner);
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
   * @returns {Searcher}
   */
  searcher() {
    const inner = this.#inner.searcher();
    return new Searcher(inner);
  }

  /**
   * Get the schema as JSON.
   * @returns {string}
   */
  schemaJSON() {
    return this.#inner.schemaJson();
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
  /** @type {import('../index.d.ts').IndexWriter} */
  #inner;

  /**
   * @param {import('../index.d.ts').IndexWriter} inner
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
