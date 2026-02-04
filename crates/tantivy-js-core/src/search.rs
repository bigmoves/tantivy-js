use napi::bindgen_prelude::*;
use tantivy::{
    query::QueryParser as TantivyQueryParser,
    collector::TopDocs,
    TantivyDocument,
    schema::OwnedValue,
};

#[napi]
pub struct Searcher {
    inner: tantivy::Searcher,
    schema: tantivy::schema::Schema,
}

impl Searcher {
    pub fn new(inner: tantivy::Searcher, schema: tantivy::schema::Schema) -> Self {
        Self { inner, schema }
    }
}

#[napi]
impl Searcher {
    #[napi]
    pub fn search(&self, query_str: String, limit: u32, fields_json: String) -> Result<String> {
        // Parse field names for query parser
        let field_names: Vec<String> = serde_json::from_str(&fields_json)
            .map_err(|e| Error::from_reason(format!("Invalid fields JSON: {}", e)))?;

        let fields: Vec<tantivy::schema::Field> = field_names
            .iter()
            .filter_map(|name| self.schema.get_field(name).ok())
            .collect();

        if fields.is_empty() {
            return Err(Error::from_reason("No valid fields provided for search"));
        }

        let query_parser = TantivyQueryParser::new(
            self.schema.clone(),
            fields,
            self.inner.index().tokenizers().clone(),
        );

        let query = query_parser.parse_query(&query_str)
            .map_err(|e| Error::from_reason(format!("Query parse error: {}", e)))?;

        let top_docs = self.inner.search(&query, &TopDocs::with_limit(limit as usize))
            .map_err(|e| Error::from_reason(format!("Search error: {}", e)))?;

        let mut results = Vec::new();
        for (_score, doc_address) in top_docs {
            let doc: TantivyDocument = self.inner.doc(doc_address)
                .map_err(|e| Error::from_reason(format!("Doc retrieval error: {}", e)))?;

            let mut doc_map = serde_json::Map::new();
            for (field, field_entry) in self.schema.fields() {
                let field_name = field_entry.name();
                for value in doc.get_all(field) {
                    match value {
                        OwnedValue::Str(s) => {
                            doc_map.insert(field_name.to_string(), serde_json::Value::String(s.to_string()));
                        }
                        OwnedValue::I64(i) => {
                            doc_map.insert(field_name.to_string(), serde_json::Value::Number((*i).into()));
                        }
                        OwnedValue::F64(f) => {
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
            .map_err(|e| Error::from_reason(format!("JSON serialize error: {}", e)))
    }
}
