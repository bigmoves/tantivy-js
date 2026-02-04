# tantivy-js

Full-text search powered by [tantivy](https://github.com/quickwit-oss/tantivy) as a native Node.js addon. Multi-threaded, fast, with support for in-memory and persistent indexes.

## Installation

```bash
npm install @bigmoves/tantivy-js
```

## Usage

```javascript
import { SchemaBuilder, Index } from '@bigmoves/tantivy-js';

// Define schema
const schema = new SchemaBuilder()
  .addTextField('title', { stored: true, indexed: true })
  .addTextField('body', { stored: true, indexed: true })
  .addI64Field('year', { stored: true })
  .build();

// Create in-memory index
const index = Index.create(schema);

// Or open/create a persistent index
// const index = Index.open('./my-index', schema);

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
- `Index.open(path, schema)` - Open or create a persistent index at path
- `writer(heapSize?)` - Get an IndexWriter
- `searcher()` - Get a Searcher

### `IndexWriter`

- `addDocument(doc)` - Add a document (plain JS object)
- `deleteByTerm(field, term)` - Delete documents matching term
- `commit()` - Commit pending changes

### `Searcher`

- `search(query, fields, options?)` - Search the index

## Platforms

Prebuilt binaries are available for:
- macOS (x64, arm64)
- Linux (x64, arm64)

## Building from Source

Requirements:
- Rust toolchain
- Node.js 18+

```bash
npm install
npm run build
```

## License

MIT
