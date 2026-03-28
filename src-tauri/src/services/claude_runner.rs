use crate::models::template::Template;
use crate::models::transform_result::TransformResult;
use crate::services::settings_store;
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::Instant;
use tokio::process::Command;

const MULTI_RESULT_FIELD: &str = "results";

fn resolve_claude_path() -> String {
    let settings = settings_store::load_settings();
    if let Some(ref path) = settings.claude_path {
        if !path.is_empty() {
            return path.clone();
        }
    }

    let home = dirs::home_dir().unwrap_or_default();
    let candidates = [
        home.join(".local/bin/claude"),
        home.join(".cargo/bin/claude"),
        PathBuf::from("/usr/local/bin/claude"),
        PathBuf::from("/opt/homebrew/bin/claude"),
    ];

    for path in &candidates {
        if path.exists() {
            return path.to_string_lossy().to_string();
        }
    }

    "claude".to_string()
}

fn build_prompt(inputs: &[String], template: &Template, count: usize) -> String {
    let mut prompt = String::new();

    // 템플릿 컨텍스트
    prompt.push_str(&format!("# Template: {}\n", template.name));
    if !template.description.is_empty() {
        prompt.push_str(&format!("Purpose: {}\n", template.description));
    }
    prompt.push_str("\n");

    // 복수 결과 지시 (시스템 프롬프트 캐싱을 위해 유저 프롬프트에 포함)
    if count > 1 {
        prompt.push_str(&format!(
            "## Multiple Results\nProduce EXACTLY {} DIFFERENT results as a JSON array. Each result must contain unique, distinct data — never duplicate the same entity or record.\n\n",
            count
        ));
        if inputs.len() == count {
            prompt.push_str(
                "The number of requested results matches the number of inputs. Prefer mapping one result to each input in order unless the inputs clearly need to be merged.\n\n",
            );
        }
    }

    // 입력 데이터를 타입별로 구분
    let mut texts: Vec<(usize, &str)> = Vec::new();
    let mut files: Vec<(usize, &str)> = Vec::new();
    let mut urls: Vec<(usize, &str)> = Vec::new();

    for (i, input) in inputs.iter().enumerate() {
        if let Some(content) = input.strip_prefix("TEXT: ") {
            texts.push((i + 1, content));
        } else if let Some(path) = input.strip_prefix("FILE: ") {
            files.push((i + 1, path));
        } else if let Some(url) = input.strip_prefix("URL: ") {
            urls.push((i + 1, url));
        } else {
            texts.push((i + 1, input));
        }
    }

    if !texts.is_empty() {
        prompt.push_str("## Text Inputs\n");
        for (idx, content) in &texts {
            prompt.push_str(&format!("[Input {}]\n{}\n\n", idx, content));
        }
    }

    if !files.is_empty() {
        prompt.push_str("## File Inputs (read each file to extract data)\n");
        for (idx, path) in &files {
            prompt.push_str(&format!("[Input {}] {}\n", idx, path));
        }
        prompt.push_str("\n");
    }

    if !urls.is_empty() {
        prompt.push_str("## URL Inputs (fetch each page to extract data)\n");
        for (idx, url) in &urls {
            prompt.push_str(&format!("[Input {}] {}\n", idx, url));
        }
        prompt.push_str("\n");
    }

    prompt.push_str("Process all inputs above and produce the JSON output matching the template schema.\n");

    prompt
}

fn build_system_prompt() -> String {
    let mut sp = String::new();

    // 핵심 역할
    sp.push_str("You are a data extraction and transformation engine.\n");
    sp.push_str("Your job is to understand the PURPOSE and CONTEXT of the given JSON template, then extract the most relevant information from the provided inputs to populate it accurately.\n\n");

    // 입력 처리 원칙
    sp.push_str("## Input Handling\n");
    sp.push_str("Inputs are prefixed with their type:\n");
    sp.push_str("- TEXT: Raw text content. Analyze it directly.\n");
    sp.push_str("- FILE: A file path on the local filesystem. You MUST open and read the file to extract its contents. If the file format is not directly readable, use Python or other tools to parse it (e.g., Excel, PDF, CSV, images).\n");
    sp.push_str("- URL: A web address. You MUST fetch the page content and analyze it. Navigate links if needed to gather sufficient context.\n\n");

    // 도구 활용
    sp.push_str("## Tool Usage\n");
    sp.push_str("Use every tool at your disposal to fully process each input:\n");
    sp.push_str("- Read files using the Read tool or cat command.\n");
    sp.push_str("- For binary or complex formats (Excel, PDF, images), write and run a Python script to extract the data.\n");
    sp.push_str("- For URLs, use WebFetch or curl to retrieve page content.\n");
    sp.push_str("- Do NOT skip or guess. Always access the actual data before producing output.\n\n");

    // 변환 원칙
    sp.push_str("## Transformation Principles\n");
    sp.push_str("- Understand what the template is trying to capture. If it's a person profile, extract person-related data. If it's a report, structure the data as a report.\n");
    sp.push_str("- Combine information from ALL inputs to produce the most complete result.\n");
    sp.push_str("- When information is ambiguous, use context and reasoning to determine the best fit.\n");
    sp.push_str("- If a required field cannot be determined from any input, use null.\n\n");

    sp
}

/// ASCII 키 패턴: JSON Schema 프로퍼티 키로 허용되는 문자 (^[a-zA-Z0-9_.-]{1,64}$)
fn is_ascii_key(key: &str) -> bool {
    !key.is_empty()
        && key.len() <= 64
        && key
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '.' || c == '-')
}

/// 스키마에서 non-ASCII 키를 field_N으로 치환하고, 매핑 테이블을 반환
/// key_map: field_0 → 원본키, field_1 → 원본키, ...
fn sanitize_schema_keys(
    schema: &serde_json::Value,
    key_map: &mut HashMap<String, String>,
) -> serde_json::Value {
    match schema {
        serde_json::Value::Object(map) => {
            // properties 객체 안의 키들을 치환
            if let Some(props) = map.get("properties") {
                if let serde_json::Value::Object(prop_map) = props {
                    let mut new_props = serde_json::Map::new();
                    let mut new_required = Vec::new();

                    // 기존 required 목록
                    let required_keys: Vec<String> = map
                        .get("required")
                        .and_then(|v| v.as_array())
                        .map(|arr| {
                            arr.iter()
                                .filter_map(|v| v.as_str().map(String::from))
                                .collect()
                        })
                        .unwrap_or_default();

                    for (original_key, value) in prop_map {
                        let safe_key = if is_ascii_key(original_key) {
                            original_key.clone()
                        } else {
                            let alias = format!("field_{}", key_map.len());
                            key_map.insert(alias.clone(), original_key.clone());
                            alias
                        };

                        // required에 원본 키가 있으면 새 키로 치환
                        if required_keys.contains(original_key) {
                            new_required.push(serde_json::Value::String(safe_key.clone()));
                        }

                        // 중첩 객체도 재귀 처리
                        let sanitized_value = sanitize_schema_keys(value, key_map);
                        new_props.insert(safe_key, sanitized_value);
                    }

                    let mut new_map = map.clone();
                    new_map.insert(
                        "properties".to_string(),
                        serde_json::Value::Object(new_props),
                    );
                    // required가 원본에 있었으면 반드시 치환된 키로 덮어쓰기
                    // (clone한 원본에 한국어 키가 남아있으므로)
                    if map.contains_key("required") {
                        new_map.insert(
                            "required".to_string(),
                            serde_json::Value::Array(new_required),
                        );
                    }
                    return serde_json::Value::Object(new_map);
                }
            }

            // items (배열 내부 스키마) 재귀 처리
            if let Some(items) = map.get("items") {
                let mut new_map = map.clone();
                new_map.insert("items".to_string(), sanitize_schema_keys(items, key_map));
                return serde_json::Value::Object(new_map);
            }

            schema.clone()
        }
        _ => schema.clone(),
    }
}

/// 결과 JSON의 영문 키를 원래 키로 복원
fn restore_keys(value: &serde_json::Value, key_map: &HashMap<String, String>) -> serde_json::Value {
    match value {
        serde_json::Value::Object(map) => {
            let mut new_map = serde_json::Map::new();
            for (k, v) in map {
                let original_key = key_map.get(k).unwrap_or(k).clone();
                new_map.insert(original_key, restore_keys(v, key_map));
            }
            serde_json::Value::Object(new_map)
        }
        serde_json::Value::Array(arr) => {
            serde_json::Value::Array(arr.iter().map(|v| restore_keys(v, key_map)).collect())
        }
        _ => value.clone(),
    }
}

/// 프롬프트에 추가할 필드 매핑 설명 생성
fn build_field_mapping_hint(
    key_map: &HashMap<String, String>,
    schema: &serde_json::Value,
) -> String {
    if key_map.is_empty() {
        return String::new();
    }

    let mut hint = String::from("## Field Mapping\nThe JSON output uses aliased field names. Here is what each field represents:\n");
    for (alias, original) in key_map {
        // 스키마에서 타입 정보 추출
        let type_info = schema
            .get("properties")
            .and_then(|p| p.get(original))
            .and_then(|f| f.get("type"))
            .and_then(|t| t.as_str())
            .unwrap_or("unknown");
        hint.push_str(&format!("- `{}` → \"{}\" ({})\n", alias, original, type_info));
    }
    hint.push('\n');
    hint
}

fn build_json_schema(
    template: &Template,
    count: usize,
    key_map: &mut HashMap<String, String>,
) -> Option<String> {
    let schema = template.json_schema.as_ref()?;

    let sanitized = sanitize_schema_keys(schema, key_map);

    let final_schema = if count > 1 {
        serde_json::json!({
            "type": "object",
            "properties": {
                MULTI_RESULT_FIELD: {
                    "type": "array",
                    "items": sanitized,
                    "minItems": count,
                    "maxItems": count
                }
            },
            "required": [MULTI_RESULT_FIELD],
            "additionalProperties": false
        })
    } else {
        sanitized
    };

    serde_json::to_string(&final_schema).ok()
}

pub async fn run_claude(inputs: &[String], template: &Template, count: usize) -> TransformResult {
    let start = Instant::now();
    let claude_path = resolve_claude_path();

    // 스키마 키 변환 (non-ASCII → field_N)
    let mut key_map: HashMap<String, String> = HashMap::new();
    let json_schema = build_json_schema(template, count, &mut key_map);

    // 프롬프트에 필드 매핑 힌트 추가
    let field_hint = template
        .json_schema
        .as_ref()
        .map(|s| build_field_mapping_hint(&key_map, s))
        .unwrap_or_default();

    let mut prompt = build_prompt(inputs, template, count);
    if !field_hint.is_empty() {
        prompt.push_str(&field_hint);
    }

    let timeout_duration = std::time::Duration::from_secs(300);

    let system_prompt = build_system_prompt();

    let task = async {
        let mut cmd = Command::new(&claude_path);
        cmd.arg("--print")
            .arg("--model").arg("opus")
            .arg("--effort").arg("max")
            .arg("--output-format").arg("json")
            .arg("--dangerously-skip-permissions");

        if let Some(ref schema) = json_schema {
            cmd.arg("--json-schema").arg(schema);
        }

        cmd.arg("--append-system-prompt").arg(&system_prompt);

        // 프롬프트는 마지막 positional argument로 전달
        cmd.arg(&prompt);

        let child = cmd
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to run claude: {}. Is Claude Code installed?", e))?;

        let output = child.wait_with_output().await
            .map_err(|e| format!("Failed to wait for claude: {}", e))?;

        Ok::<_, String>(output)
    };

    let duration_ms;

    match tokio::time::timeout(timeout_duration, task).await {
        Ok(Ok(output)) => {
            duration_ms = start.elapsed().as_millis() as u64;
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();

            if !output.status.success() {
                return TransformResult {
                    template_id: template.id.clone(),
                    template_name: template.name.clone(),
                    output: serde_json::Value::Null,
                    success: false,
                    error: Some(format!(
                        "Claude CLI failed: {}",
                        extract_cli_error(&stdout, &stderr)
                    )),
                    duration_ms,
                };
            }

            // --output-format json 이므로 structured_output 또는 result 파싱
            let parsed_output = parse_claude_response(&stdout);
            match parsed_output {
                Ok(value) => match normalize_output(value, count) {
                    Ok(value) => {
                        // 영문 키를 원래 키로 복원
                        let restored = if key_map.is_empty() {
                            value
                        } else {
                            restore_keys(&value, &key_map)
                        };
                        TransformResult {
                            template_id: template.id.clone(),
                            template_name: template.name.clone(),
                            output: restored,
                            success: true,
                            error: None,
                            duration_ms,
                        }
                    }
                    Err(e) => TransformResult {
                        template_id: template.id.clone(),
                        template_name: template.name.clone(),
                        output: serde_json::Value::String(stdout),
                        success: false,
                        error: Some(format!("Output normalization error: {}", e)),
                        duration_ms,
                    },
                },
                Err(e) => TransformResult {
                    template_id: template.id.clone(),
                    template_name: template.name.clone(),
                    output: serde_json::Value::String(stdout),
                    success: false,
                    error: Some(format!("Parse error: {}", e)),
                    duration_ms,
                },
            }
        }
        Ok(Err(e)) => {
            duration_ms = start.elapsed().as_millis() as u64;
            TransformResult {
                template_id: template.id.clone(),
                template_name: template.name.clone(),
                output: serde_json::Value::Null,
                success: false,
                error: Some(e),
                duration_ms,
            }
        }
        Err(_) => {
            duration_ms = start.elapsed().as_millis() as u64;
            TransformResult {
                template_id: template.id.clone(),
                template_name: template.name.clone(),
                output: serde_json::Value::Null,
                success: false,
                error: Some("Claude CLI timed out (5 min limit exceeded)".to_string()),
                duration_ms,
            }
        }
    }
}

/// Claude CLI의 --output-format json 응답에서 결과 추출
/// structured_output이 있으면 우선, 없으면 result 텍스트에서 JSON 추출
fn parse_claude_response(stdout: &str) -> Result<serde_json::Value, String> {
    let response: serde_json::Value = serde_json::from_str(stdout)
        .map_err(|e| format!("Failed to parse CLI response: {}", e))?;

    // --json-schema 사용 시 structured_output에 검증된 JSON이 들어옴
    if let Some(structured) = response.get("structured_output") {
        if !structured.is_null() {
            return Ok(structured.clone());
        }
    }

    // fallback: result 텍스트에서 JSON 추출
    if let Some(result_text) = response.get("result").and_then(|v| v.as_str()) {
        let json_str = extract_json(result_text);
        return serde_json::from_str(&json_str)
            .map_err(|e| format!("JSON parse error: {}", e));
    }

    Err("No output found in Claude response".to_string())
}

fn normalize_output(value: serde_json::Value, count: usize) -> Result<serde_json::Value, String> {
    if count <= 1 {
        return Ok(value);
    }

    match value {
        serde_json::Value::Array(_) => Ok(value),
        serde_json::Value::Object(mut map) => map
            .remove(MULTI_RESULT_FIELD)
            .ok_or_else(|| format!("Missing `{}` field in structured output", MULTI_RESULT_FIELD)),
        _ => Err("Expected an array result for repeated template runs".to_string()),
    }
}

fn extract_cli_error(stdout: &str, stderr: &str) -> String {
    let stderr = stderr.trim();
    if !stderr.is_empty() {
        return stderr.to_string();
    }

    if let Ok(response) = serde_json::from_str::<serde_json::Value>(stdout) {
        for key in ["error", "message", "result"] {
            if let Some(message) = response.get(key).and_then(|v| v.as_str()) {
                let message = message.trim();
                if !message.is_empty() {
                    return message.to_string();
                }
            }
        }
    }

    let stdout = stdout.trim();
    if !stdout.is_empty() {
        return stdout.to_string();
    }

    "process exited with a non-zero status without an error message".to_string()
}

fn extract_json(text: &str) -> String {
    let trimmed = text.trim();

    if serde_json::from_str::<serde_json::Value>(trimmed).is_ok() {
        return trimmed.to_string();
    }

    for open_char in ['{', '['] {
        let close_char = if open_char == '{' { '}' } else { ']' };

        if let Some(start) = trimmed.find(open_char) {
            let mut depth = 0;
            let mut in_string = false;
            let mut escape_next = false;

            for (i, ch) in trimmed[start..].char_indices() {
                if escape_next {
                    escape_next = false;
                    continue;
                }
                if ch == '\\' && in_string {
                    escape_next = true;
                    continue;
                }
                if ch == '"' {
                    in_string = !in_string;
                    continue;
                }
                if in_string {
                    continue;
                }
                if ch == open_char {
                    depth += 1;
                } else if ch == close_char {
                    depth -= 1;
                    if depth == 0 {
                        let candidate = &trimmed[start..start + i + 1];
                        if serde_json::from_str::<serde_json::Value>(candidate).is_ok() {
                            return candidate.to_string();
                        }
                        break;
                    }
                }
            }
        }
    }

    trimmed.to_string()
}
