// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Emitter;
use std::thread;
use std::time::Duration;
use std::fs;
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static; // Import lazy_static

// Use Arc and Mutex to safely share the stop signal between threads
lazy_static! {
    static ref STOP_TIMER: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
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
fn start_timer(window: tauri::Window, seconds: u32) {
    // Before starting a new timer, ensure any existing timer is stopped
    reset_timer_internal(&window);

    // Set the stop signal to false at the start of the new timer
    {
        let mut stop_timer = STOP_TIMER.lock().unwrap();
        *stop_timer = false;
    }

    let stop_signal = STOP_TIMER.clone(); // Clone the Arc for the thread

    thread::spawn(move || {
        for i in (0..=seconds).rev() {
            // Check if the stop signal is true before emitting the event
            if *stop_signal.lock().unwrap() {
                println!("Timer stopped");
                break;
            }

            window.emit("timer-update", i).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });
}

#[tauri::command]
fn reset_timer(window: tauri::Window) {
    reset_timer_internal(&window);
}

// Internal function to reset the timer logic
fn reset_timer_internal(window: &tauri::Window) {
    // Set the stop signal to true to stop any running timer
    let mut stop_timer = STOP_TIMER.lock().unwrap();
    *stop_timer = true;

    // Emit an event with 0 to reset the time on the frontend
    window.emit("timer-update", 0).unwrap();
}


fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![start_timer, load_schedules, save_schedules, reset_timer])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}