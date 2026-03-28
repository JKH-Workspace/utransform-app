use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Template {
    pub id: String,
    pub name: String,
    pub description: String,
    #[serde(default)]
    pub json_schema: Option<serde_json::Value>,
    #[serde(default)]
    pub example_output: Option<serde_json::Value>,
    pub created_at: String,
    pub updated_at: String,
}
