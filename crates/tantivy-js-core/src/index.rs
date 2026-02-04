use napi::bindgen_prelude::*;
use tantivy::{
    Index as TantivyIndex,
    IndexWriter as TantivyIndexWriter,
    TantivyDocument,
    directory::{RamDirectory, MmapDirectory},
    schema::Term,
    IndexSettings,
    ReloadPolicy,
};
use crate::schema::Schema;
use crate::search::Searcher;
use std::sync::{Arc, RwLock};
use std::path::PathBuf;

#[napi]
pub struct Index {
    inner: Arc<RwLock<TantivyIndex>>,
    #[allow(dead_code)]
    path: Option<PathBuf>,
}

#[napi]
impl Index {
    /// Create an in-memory index
    #[napi(factory)]
    pub fn create(schema: &Schema) -> Result<Index> {
        let dir = RamDirectory::create();
        let index = TantivyIndex::create(dir, schema.inner.clone(), IndexSettings::default())
            .map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(Index {
            inner: Arc::new(RwLock::new(index)),
            path: None,
        })
    }

    /// Open or create a persistent index at the given path
    #[napi(factory)]
    pub fn open(path: String, schema: &Schema) -> Result<Index> {
        let path_buf = PathBuf::from(&path);

        // Create directory if it doesn't exist
        if !path_buf.exists() {
            std::fs::create_dir_all(&path_buf)
                .map_err(|e| Error::from_reason(format!("Failed to create directory: {}", e)))?;
        }

        let dir = MmapDirectory::open(&path_buf)
            .map_err(|e| Error::from_reason(e.to_string()))?;

        // Try to open existing index, or create new one
        let index = if path_buf.join("meta.json").exists() {
            TantivyIndex::open(dir)
                .map_err(|e| Error::from_reason(e.to_string()))?
        } else {
            TantivyIndex::create(dir, schema.inner.clone(), IndexSettings::default())
                .map_err(|e| Error::from_reason(e.to_string()))?
        };

        Ok(Index {
            inner: Arc::new(RwLock::new(index)),
            path: Some(path_buf),
        })
    }

    #[napi]
    pub fn writer(&self, heap_size: Option<u32>) -> Result<IndexWriter> {
        let heap = heap_size.map(|h| h as usize).unwrap_or(50_000_000); // 50MB default
        let index = self.inner.read()
            .map_err(|e| Error::from_reason(e.to_string()))?;
        let writer = index.writer(heap)
            .map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(IndexWriter {
            inner: Some(writer),
            schema: index.schema(),
        })
    }

    #[napi(js_name = "schemaJson")]
    pub fn schema_json(&self) -> Result<String> {
        let index = self.inner.read()
            .map_err(|e| Error::from_reason(e.to_string()))?;
        Ok(serde_json::to_string(&index.schema()).unwrap_or_default())
    }

    #[napi]
    pub fn searcher(&self) -> Result<Searcher> {
        let index_guard = self.inner.read()
            .map_err(|e| Error::from_reason(e.to_string()))?;
        let reader = index_guard
            .reader_builder()
            .reload_policy(ReloadPolicy::Manual)
            .try_into()
            .map_err(|e: tantivy::TantivyError| Error::from_reason(e.to_string()))?;

        Ok(Searcher::new(reader.searcher(), index_guard.schema()))
    }
}

#[napi]
pub struct IndexWriter {
    inner: Option<TantivyIndexWriter>,
    schema: tantivy::schema::Schema,
}

#[napi]
impl IndexWriter {
    #[napi(js_name = "addDocument")]
    pub fn add_document(&mut self, doc_json: String) -> Result<()> {
        let json_value: serde_json::Value = serde_json::from_str(&doc_json)
            .map_err(|e| Error::from_reason(format!("Invalid JSON: {}", e)))?;

        let mut doc = TantivyDocument::new();

        if let serde_json::Value::Object(map) = json_value {
            for (field_name, value) in map {
                if let Ok(field) = self.schema.get_field(&field_name) {
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

        if let Some(ref mut writer) = self.inner {
            writer.add_document(doc)
                .map_err(|e| Error::from_reason(e.to_string()))?;
        }
        Ok(())
    }

    #[napi]
    pub fn commit(&mut self) -> Result<u64> {
        if let Some(ref mut writer) = self.inner {
            let opstamp = writer.commit()
                .map_err(|e| Error::from_reason(e.to_string()))?;
            return Ok(opstamp);
        }
        Err(Error::from_reason("Writer not available"))
    }

    #[napi(js_name = "deleteByTerm")]
    pub fn delete_by_term(&mut self, field_name: String, term_value: String) -> Result<()> {
        let field = self.schema.get_field(&field_name)
            .map_err(|_| Error::from_reason(format!("Unknown field: {}", field_name)))?;

        let term = Term::from_field_text(field, &term_value);

        if let Some(ref mut writer) = self.inner {
            writer.delete_term(term);
        }
        Ok(())
    }
}
