// src/searcher.js

/**
 * @typedef {Object} SearchOptions
 * @property {number} [limit=10] - Maximum results to return
 */

/**
 * Searcher for querying an index.
 */
export class Searcher {
  /** @type {import('../index.d.ts').Searcher} */
  #inner;

  /**
   * @param {import('../index.d.ts').Searcher} inner
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
