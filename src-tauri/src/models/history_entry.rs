use serde::{Deserialize, Serialize};
use crate::models::transform_result::TransformResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub inputs: Vec<String>,
    pub results: Vec<TransformResult>,
    pub created_at: String,
}
