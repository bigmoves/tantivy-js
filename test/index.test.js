// test/index.test.js
import { describe, it, expect } from 'vitest';
import { SchemaBuilder, Index } from '../src/index.js';

describe('Index', () => {

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

    // Add documents
    writer.addDocument({ id: '1', title: 'First' });
    writer.addDocument({ id: '2', title: 'Second' });
    writer.commit();

    // Delete document with id='1' using same writer
    writer.deleteByTerm('id', '1');
    writer.commit();

    const searcher = index.searcher();
    // Search for a term that matches the remaining document
    const results = searcher.search('second', ['title'], { limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Second');
  });
});
