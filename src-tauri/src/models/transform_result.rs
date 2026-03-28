use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransformResult {
    pub template_id: String,
    pub template_name: String,
    pub output: serde_json::Value,
    pub success: bool,
    pub error: Option<String>,
    pub duration_ms: u64,
}
