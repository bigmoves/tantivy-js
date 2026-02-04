// test/schema.test.js
import { describe, it, expect } from 'vitest';
import { SchemaBuilder } from '../src/index.js';

describe('SchemaBuilder', () => {
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
