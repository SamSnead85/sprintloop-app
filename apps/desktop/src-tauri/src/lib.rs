// SprintLoop Desktop - Main Rust Entry Point
// Tauri 2.0 Native Application

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

// File entry structure for directory listing
#[derive(Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: u64,
}

// Custom commands exposed to the frontend
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to SprintLoop.", name)
}

#[tauri::command]
fn get_system_info() -> serde_json::Value {
    serde_json::json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "family": std::env::consts::FAMILY
    })
}

#[tauri::command]
fn read_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let path = PathBuf::from(&path);
    
    if !path.exists() {
        return Err(format!("Path does not exist: {}", path.display()));
    }
    
    let mut entries = Vec::new();
    
    match fs::read_dir(&path) {
        Ok(read_dir) => {
            for entry in read_dir.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    let modified = metadata
                        .modified()
                        .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs())
                        .unwrap_or(0);
                    
                    entries.push(FileEntry {
                        name: entry.file_name().to_string_lossy().to_string(),
                        path: entry.path().to_string_lossy().to_string(),
                        is_dir: metadata.is_dir(),
                        size: metadata.len(),
                        modified,
                    });
                }
            }
            // Sort: directories first, then by name
            entries.sort_by(|a, b| {
                match (a.is_dir, b.is_dir) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                }
            });
            Ok(entries)
        }
        Err(e) => Err(format!("Failed to read directory: {}", e)),
    }
}

#[tauri::command]
fn read_file_content(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
fn write_file_content(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not determine home directory".to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_info,
            read_directory,
            read_file_content,
            write_file_content,
            get_home_dir
        ])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                // DevTools disabled to avoid unused variable warning
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running SprintLoop");
}
