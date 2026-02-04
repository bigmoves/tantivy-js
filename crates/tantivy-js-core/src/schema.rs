use napi::bindgen_prelude::*;
use tantivy::schema::{
    Schema as TantivySchema,
    SchemaBuilder as TantivySchemaBuilder,
    TextOptions, NumericOptions, BytesOptions,
    STORED, TEXT,
};

#[napi]
pub struct Schema {
    pub(crate) inner: TantivySchema,
}

#[napi]
impl Schema {
    #[napi]
    pub fn to_json(&self) -> String {
        serde_json::to_string(&self.inner).unwrap_or_default()
    }

    #[napi(getter)]
    pub fn num_fields(&self) -> u32 {
        self.inner.fields().count() as u32
    }
}

#[napi]
pub struct SchemaBuilder {
    inner: Option<TantivySchemaBuilder>,
}

#[napi]
impl SchemaBuilder {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            inner: Some(TantivySchemaBuilder::new()),
        }
    }

    #[napi(js_name = "addTextField")]
    pub fn add_text_field(&mut self, name: String, stored: bool, indexed: bool) -> Result<u32> {
        let builder = self.inner.as_mut()
            .ok_or_else(|| Error::from_reason("SchemaBuilder already consumed"))?;
        let mut opts = TextOptions::default();
        if stored {
            opts = opts | STORED;
        }
        if indexed {
            opts = opts | TEXT;
        }
        Ok(builder.add_text_field(&name, opts).field_id())
    }

    #[napi(js_name = "addI64Field")]
    pub fn add_i64_field(&mut self, name: String, stored: bool, indexed: bool, fast: bool) -> Result<u32> {
        let builder = self.inner.as_mut()
            .ok_or_else(|| Error::from_reason("SchemaBuilder already consumed"))?;
        let mut opts = NumericOptions::default();
        if stored {
            opts = opts.set_stored();
        }
        if indexed {
            opts = opts.set_indexed();
        }
        if fast {
            opts = opts.set_fast();
        }
        Ok(builder.add_i64_field(&name, opts).field_id())
    }

    #[napi(js_name = "addF64Field")]
    pub fn add_f64_field(&mut self, name: String, stored: bool, indexed: bool, fast: bool) -> Result<u32> {
        let builder = self.inner.as_mut()
            .ok_or_else(|| Error::from_reason("SchemaBuilder already consumed"))?;
        let mut opts = NumericOptions::default();
        if stored {
            opts = opts.set_stored();
        }
        if indexed {
            opts = opts.set_indexed();
        }
        if fast {
            opts = opts.set_fast();
        }
        Ok(builder.add_f64_field(&name, opts).field_id())
    }

    #[napi(js_name = "addBytesField")]
    pub fn add_bytes_field(&mut self, name: String, stored: bool, indexed: bool, fast: bool) -> Result<u32> {
        let builder = self.inner.as_mut()
            .ok_or_else(|| Error::from_reason("SchemaBuilder already consumed"))?;
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
        Ok(builder.add_bytes_field(&name, opts).field_id())
    }

    #[napi]
    pub fn build(&mut self) -> Result<Schema> {
        let builder = self.inner.take()
            .ok_or_else(|| Error::from_reason("SchemaBuilder already consumed"))?;
        Ok(Schema {
            inner: builder.build(),
        })
    }
}
