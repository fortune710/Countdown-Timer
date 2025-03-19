// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Emitter;
use std::thread;
use std::time::Duration;
use std::fs;

#[tauri::command]
fn save_schedules(schedules: String) {
    fs::write("schedules.json", schedules).expect("Failed to save schedules");
}

#[tauri::command]
fn load_schedules() -> String {
    fs::read_to_string("schedules.json").unwrap_or("[]".to_string())
}

#[tauri::command]
fn start_timer(window: tauri::Window, seconds: u32) {
    thread::spawn(move || {
        for i in (0..=seconds).rev() {
            window.emit("timer-update", i).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![start_timer, load_schedules, save_schedules])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}