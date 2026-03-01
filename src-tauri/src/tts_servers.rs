use std::process::Command;
use std::sync::Mutex;
use tauri::State;

// --- Fetch audio from localhost TTS servers (bypasses browser fetch issues) ---

#[tauri::command]
#[specta::specta]
pub fn fetch_tts_audio(url: String) -> Result<Vec<u8>, String> {
    let client = reqwest::blocking::Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .map_err(|e| format!("TTS fetch error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("TTS server error {}: {}", response.status(), response.text().unwrap_or_default()));
    }

    response.bytes()
        .map(|b| b.to_vec())
        .map_err(|e| format!("Failed to read TTS audio: {}", e))
}

pub struct TtsServerState {
    pub kittentts_pid: Mutex<Option<u32>>,
}

// --- OpenTTS (Docker) ---

#[tauri::command]
#[specta::specta]
pub fn opentts_start() -> Result<String, String> {
    // Try starting an existing stopped container first
    let start = Command::new("docker")
        .args(["start", "opentts"])
        .output()
        .map_err(|e| format!("Failed to run docker: {}", e))?;

    if start.status.success() {
        return Ok("started".to_string());
    }

    // Container doesn't exist — create it
    let run = Command::new("docker")
        .args([
            "run",
            "-d",
            "--name",
            "opentts",
            "-p",
            "5500:5500",
            "synesthesiam/opentts:en",
        ])
        .output()
        .map_err(|e| format!("Failed to run docker: {}", e))?;

    if run.status.success() {
        Ok("started".to_string())
    } else {
        Err(String::from_utf8_lossy(&run.stderr).trim().to_string())
    }
}

#[tauri::command]
#[specta::specta]
pub fn opentts_stop() -> Result<String, String> {
    let output = Command::new("docker")
        .args(["stop", "opentts"])
        .output()
        .map_err(|e| format!("Failed to run docker: {}", e))?;

    if output.status.success() {
        Ok("stopped".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

// --- KittenTTS (Python server) ---

#[tauri::command]
#[specta::specta]
pub fn kittentts_start(state: State<'_, TtsServerState>) -> Result<String, String> {
    let mut pid_lock = state.kittentts_pid.lock().map_err(|e| e.to_string())?;

    // Check if already running
    if let Some(pid) = *pid_lock {
        // Verify the process is still alive
        let check = Command::new("kill")
            .args(["-0", &pid.to_string()])
            .output();
        if check.map(|o| o.status.success()).unwrap_or(false) {
            return Ok("already running".to_string());
        }
        *pid_lock = None;
    }

    // Find the venv Python and server script relative to the executable
    // The server script is in scripts/ relative to the source, but users may
    // also have it alongside the binary or in a known location.
    // Try several paths.
    let script_paths = [
        // Installed alongside resources
        "/usr/lib/en-croissant-TTS/scripts/kittentts-server.py",
        // Development location
        "scripts/kittentts-server.py",
    ];

    let venv_pythons = [
        "/usr/lib/en-croissant-TTS/scripts/.venv/bin/python",
        "scripts/.venv/bin/python",
    ];

    let mut script_path = None;
    for p in &script_paths {
        if std::path::Path::new(p).exists() {
            script_path = Some(p.to_string());
            break;
        }
    }

    let mut python_path = None;
    for p in &venv_pythons {
        if std::path::Path::new(p).exists() {
            python_path = Some(p.to_string());
            break;
        }
    }

    let script = script_path.ok_or("KittenTTS server script not found")?;
    let python = python_path.unwrap_or_else(|| "python3".to_string());

    let child = Command::new(&python)
        .arg(&script)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to start KittenTTS: {}", e))?;

    let pid = child.id();
    *pid_lock = Some(pid);

    Ok("started".to_string())
}

#[tauri::command]
#[specta::specta]
pub fn kittentts_stop(state: State<'_, TtsServerState>) -> Result<String, String> {
    let mut pid_lock = state.kittentts_pid.lock().map_err(|e| e.to_string())?;

    if let Some(pid) = pid_lock.take() {
        let _ = Command::new("kill").arg(pid.to_string()).output();
        Ok("stopped".to_string())
    } else {
        // Try to kill by port as fallback
        let _ = Command::new("sh")
            .args(["-c", "fuser -k 8192/tcp 2>/dev/null"])
            .output();
        Ok("stopped".to_string())
    }
}
