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
  /** @type {import('../index.d.ts').Schema} */
  #inner;

  /**
   * @param {import('../index.d.ts').Schema} inner
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
    return this.#inner.numFields;
  }

  /**
   * Get the schema as JSON.
   * @returns {string}
   */
  toJSON() {
    return this.#inner.toJson();
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
  /** @type {import('../index.d.ts').SchemaBuilder} */
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
