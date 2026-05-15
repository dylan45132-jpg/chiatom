use reqwest::Client;

#[tauri::command]
async fn search_zotero(query: String) -> Result<serde_json::Value, String> {
    let client = Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "item.search",
        "params": [query],
        "id": 1
    });
    let res = client
        .post("http://localhost:23119/better-bibtex/json-rpc")
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(data)
}

#[tauri::command]
async fn fetch_github_releases() -> Result<String, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get("https://api.github.com/repos/dylan45132-jpg/chiatom/releases?per_page=5")
        .header("User-Agent", "Chiatom")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let text = resp.text().await.map_err(|e| e.to_string())?;
    Ok(text)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![search_zotero, fetch_github_releases])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}