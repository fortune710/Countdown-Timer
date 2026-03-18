// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use std::thread;
use std::time::Duration;
use std::fs;
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static; // Import lazy_static
use serde::Serialize;

// Use Arc and Mutex to safely share the stop signal between threads
lazy_static! {
    static ref STOP_TIMER: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

#[derive(Serialize)]
struct MonitorInfo {
    name: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

fn stop_running_timer_internal() {
    // Set the stop signal to true to stop any running timer thread
    { // Scope the lock guard
        let mut stop_timer = STOP_TIMER.lock().unwrap();
        *stop_timer = true;
        println!("Rust: Set STOP_TIMER to true (internal stop)"); // Log flag set
    } // Lock released here
}

#[tauri::command]
fn save_schedules(schedules: String) {
    fs::write("schedules.json", schedules).expect("Failed to save schedules");
}

#[tauri::command]
fn load_schedules() -> String {
    fs::read_to_string("schedules.json").unwrap_or("[]".to_string())
}

#[tauri::command]
async fn get_monitors(app: tauri::AppHandle) -> Vec<MonitorInfo> {
    let monitors = app.available_monitors().unwrap_or_default();
    println!("Rust: Detected {} monitors", monitors.len());
    monitors
        .iter()
        .map(|m| {
            let pos = m.position();
            let size = m.size();
            MonitorInfo {
                name: m.name().map(|s| s.as_str()).unwrap_or("Unknown").to_string(),
                x: pos.x,
                y: pos.y,
                width: size.width,
                height: size.height,
            }
        })
        .collect()
}

#[tauri::command]
async fn open_external_timer(app: tauri::AppHandle, monitor_x: i32, monitor_y: i32) -> Result<(), String> {
    println!("Rust: Attempting to open external timer at {}, {}", monitor_x, monitor_y);
    // Check if the external timer window already exists
    if let Some(window) = app.get_webview_window("external-timer") {
        println!("Rust: External timer already open, focusing and repositioning");
        let _ = window.show();
        let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: monitor_x,
            y: monitor_y,
        }));
        let _ = window.set_fullscreen(true);
        let _ = window.set_focus();
        return Ok(());
    }

    let url = WebviewUrl::App("/external-timer".into());

    let window = WebviewWindowBuilder::new(&app, "external-timer", url)
        .title("Timer Display")
        .decorations(false)
        .always_on_top(true)
        .visible(false)
        .build()
        .map_err(|e| format!("Failed to create external timer window: {}", e))?;

    // Position the window on the target monitor and make it fullscreen
    println!("Rust: Setting position and fullscreen for external timer");
    
    // 1. Show first so the OS knows about the window's existence visually
    let _ = window.show();
    
    // 2. Move it to the secondary monitor
    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
        x: monitor_x,
        y: monitor_y,
    }));
    
    // 3. Make it fullscreen
    let _ = window.set_fullscreen(true);
    println!("Rust: External timer shown");

    Ok(())
}

#[tauri::command]
async fn close_external_timer(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("external-timer") {
        window.close().map_err(|e| format!("Failed to close external timer window: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn start_timer(app: tauri::AppHandle, seconds: u32) {
    // Before starting a new timer, ensure any existing timer is stopped
    stop_running_timer_internal(); // Use the internal stop function

    // Set the stop signal to false at the start of the new timer
    {
        let mut stop_timer = STOP_TIMER.lock().unwrap();
        *stop_timer = false;
        println!("Rust: Set STOP_TIMER to false (for new timer)");
    }

    let stop_signal = STOP_TIMER.clone(); // Clone the Arc for the thread

    thread::spawn(move || {
        println!("Rust: Timer thread started for {} seconds", seconds);
        for i in (0..=seconds).rev() {
            // Check if the stop signal is true before emitting the event
            if *stop_signal.lock().unwrap() {
                println!("Timer stopped");
                break;
            }

            // Emit to ALL windows (main + external timer)
            app.emit("timer-update", i).unwrap();

            // Check stop signal *again* before sleeping to exit faster if stopped
            if *stop_signal.lock().unwrap() {
                println!("Rust: Stop signal received before sleep, breaking loop early");
                break;
            }

            thread::sleep(Duration::from_secs(1));
        }
    });
}

#[tauri::command]
fn reset_timer(app: tauri::AppHandle) {
    reset_timer_internal(&app);
}

// Internal function to reset the timer logic
fn reset_timer_internal(app: &tauri::AppHandle) {
    // Set the stop signal to true to stop any running timer
    stop_running_timer_internal(); // Use the internal stop

    // Set the stop signal to true to stop any running timer
    let mut stop_timer = STOP_TIMER.lock().unwrap();
    *stop_timer = true;

    // Emit to ALL windows
    app.emit("timer-update", 0).unwrap();
}


fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_timer,
            load_schedules,
            save_schedules,
            reset_timer,
            get_monitors,
            open_external_timer,
            close_external_timer
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}