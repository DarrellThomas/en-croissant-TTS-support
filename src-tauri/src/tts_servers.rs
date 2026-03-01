use serde::Serialize;
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

// --- Dependency checking ---

#[derive(Serialize, Clone, specta::Type)]
pub struct DepCheck {
    pub ok: bool,
    pub label: String,
    pub detail: String,
    pub fix_hint: String,
}

/// Shared path-resolution logic for KittenTTS resources.
struct KittenTtsPaths {
    script: Option<String>,
    python: Option<String>,
    venv_dir: Option<String>,
}

fn find_kittentts_paths() -> KittenTtsPaths {
    let script_paths = [
        "/usr/lib/en-parlant/scripts/kittentts-server.py",
        "scripts/kittentts-server.py",
    ];
    let venv_pythons = [
        "/usr/lib/en-parlant/scripts/.venv/bin/python",
        "scripts/.venv/bin/python",
    ];
    let venv_dirs = [
        "/usr/lib/en-parlant/scripts/.venv",
        "scripts/.venv",
    ];

    let script = script_paths.iter().find(|p| std::path::Path::new(p).exists()).map(|p| p.to_string());
    let python = venv_pythons.iter().find(|p| std::path::Path::new(p).exists()).map(|p| p.to_string());
    let venv_dir = venv_dirs.iter().find(|p| std::path::Path::new(p).exists()).map(|p| p.to_string());

    KittenTtsPaths { script, python, venv_dir }
}

// --- Dependency check commands ---

#[tauri::command]
#[specta::specta]
pub fn check_docker_installed() -> DepCheck {
    match Command::new("docker").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let ver = String::from_utf8_lossy(&output.stdout).trim().to_string();
            DepCheck {
                ok: true,
                label: "Docker installed".into(),
                detail: ver,
                fix_hint: String::new(),
            }
        }
        _ => DepCheck {
            ok: false,
            label: "Docker not installed".into(),
            detail: "Docker is required to run OpenTTS".into(),
            fix_hint: "sudo apt install docker.io && sudo usermod -aG docker $USER".into(),
        },
    }
}

#[tauri::command]
#[specta::specta]
pub fn check_docker_running() -> DepCheck {
    match Command::new("docker").arg("info").output() {
        Ok(output) if output.status.success() => DepCheck {
            ok: true,
            label: "Docker running".into(),
            detail: "Docker daemon is active".into(),
            fix_hint: String::new(),
        },
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let hint = if stderr.contains("permission denied") {
                "sudo usermod -aG docker $USER && newgrp docker"
            } else {
                "sudo systemctl start docker"
            };
            DepCheck {
                ok: false,
                label: "Docker not running".into(),
                detail: stderr.lines().next().unwrap_or("Docker daemon is not active").to_string(),
                fix_hint: hint.into(),
            }
        }
        _ => DepCheck {
            ok: false,
            label: "Docker not running".into(),
            detail: "Could not communicate with Docker".into(),
            fix_hint: "sudo systemctl start docker".into(),
        },
    }
}

#[tauri::command]
#[specta::specta]
pub fn check_opentts_image() -> DepCheck {
    match Command::new("docker")
        .args(["images", "-q", "synesthesiam/opentts:en"])
        .output()
    {
        Ok(output) if output.status.success() => {
            let id = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if id.is_empty() {
                DepCheck {
                    ok: false,
                    label: "OpenTTS image not found".into(),
                    detail: "Image synesthesiam/opentts:en is not pulled".into(),
                    fix_hint: "docker pull synesthesiam/opentts:en".into(),
                }
            } else {
                DepCheck {
                    ok: true,
                    label: "OpenTTS image ready".into(),
                    detail: format!("Image ID: {}", id),
                    fix_hint: String::new(),
                }
            }
        }
        _ => DepCheck {
            ok: false,
            label: "Could not check images".into(),
            detail: "Docker may not be running".into(),
            fix_hint: "docker pull synesthesiam/opentts:en".into(),
        },
    }
}

#[tauri::command]
#[specta::specta]
pub fn check_python_installed() -> DepCheck {
    match Command::new("python3").arg("--version").output() {
        Ok(output) if output.status.success() => {
            let ver = String::from_utf8_lossy(&output.stdout).trim().to_string();
            DepCheck {
                ok: true,
                label: "Python installed".into(),
                detail: ver,
                fix_hint: String::new(),
            }
        }
        _ => DepCheck {
            ok: false,
            label: "Python 3 not installed".into(),
            detail: "Python 3.10+ is required for KittenTTS".into(),
            fix_hint: "sudo apt install python3 python3-venv".into(),
        },
    }
}

#[tauri::command]
#[specta::specta]
pub fn check_kittentts_venv() -> DepCheck {
    let paths = find_kittentts_paths();
    match paths.venv_dir {
        Some(dir) => DepCheck {
            ok: true,
            label: "Virtual environment found".into(),
            detail: dir,
            fix_hint: String::new(),
        },
        None => DepCheck {
            ok: false,
            label: "Virtual environment not found".into(),
            detail: "No .venv directory found in scripts/".into(),
            fix_hint: "python3 -m venv scripts/.venv".into(),
        },
    }
}

#[tauri::command]
#[specta::specta]
pub fn check_kittentts_packages() -> DepCheck {
    let paths = find_kittentts_paths();
    let python = match paths.python {
        Some(p) => p,
        None => {
            return DepCheck {
                ok: false,
                label: "Packages not installed".into(),
                detail: "Virtual environment not found — create it first".into(),
                fix_hint: "Create venv, then install packages".into(),
            };
        }
    };

    match Command::new(&python)
        .args(["-c", "import kittentts; import flask; import soundfile; import numpy"])
        .output()
    {
        Ok(output) if output.status.success() => DepCheck {
            ok: true,
            label: "Python packages installed".into(),
            detail: "kittentts, flask, soundfile, numpy".into(),
            fix_hint: String::new(),
        },
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let missing = if stderr.contains("kittentts") {
                "kittentts"
            } else if stderr.contains("flask") {
                "flask"
            } else if stderr.contains("soundfile") {
                "soundfile"
            } else if stderr.contains("numpy") {
                "numpy"
            } else {
                "some packages"
            };
            DepCheck {
                ok: false,
                label: format!("Missing: {}", missing),
                detail: stderr.lines().next().unwrap_or("Import failed").to_string(),
                fix_hint: "pip install kittentts flask soundfile numpy".into(),
            }
        }
        _ => DepCheck {
            ok: false,
            label: "Could not check packages".into(),
            detail: "Failed to run venv Python".into(),
            fix_hint: "Recreate the virtual environment".into(),
        },
    }
}

#[tauri::command]
#[specta::specta]
pub fn check_kittentts_script() -> DepCheck {
    let paths = find_kittentts_paths();
    match paths.script {
        Some(path) => DepCheck {
            ok: true,
            label: "Server script found".into(),
            detail: path,
            fix_hint: String::new(),
        },
        None => DepCheck {
            ok: false,
            label: "Server script not found".into(),
            detail: "kittentts-server.py not found in expected locations".into(),
            fix_hint: "Reinstall the application".into(),
        },
    }
}

// --- Setup commands (long-running) ---

#[tauri::command]
#[specta::specta]
pub fn setup_kittentts_venv() -> Result<String, String> {
    // Determine the venv directory — prefer installed location, fall back to dev
    let venv_dir = if std::path::Path::new("/usr/lib/en-parlant/scripts").exists() {
        "/usr/lib/en-parlant/scripts/.venv"
    } else {
        "scripts/.venv"
    };

    // Create venv if it doesn't exist
    if !std::path::Path::new(venv_dir).exists() {
        let create = Command::new("python3")
            .args(["-m", "venv", venv_dir])
            .output()
            .map_err(|e| format!("Failed to create venv: {}", e))?;
        if !create.status.success() {
            return Err(format!(
                "Failed to create venv: {}",
                String::from_utf8_lossy(&create.stderr).trim()
            ));
        }
    }

    // Install packages
    let pip = format!("{}/bin/pip", venv_dir);
    let install = Command::new(&pip)
        .args(["install", "kittentts", "flask", "soundfile", "numpy"])
        .output()
        .map_err(|e| format!("Failed to run pip: {}", e))?;

    if install.status.success() {
        Ok("Packages installed successfully".to_string())
    } else {
        Err(format!(
            "pip install failed: {}",
            String::from_utf8_lossy(&install.stderr).trim()
        ))
    }
}

#[tauri::command]
#[specta::specta]
pub fn setup_opentts_pull() -> Result<String, String> {
    let pull = Command::new("docker")
        .args(["pull", "synesthesiam/opentts:en"])
        .output()
        .map_err(|e| format!("Failed to run docker pull: {}", e))?;

    if pull.status.success() {
        Ok("Image pulled successfully".to_string())
    } else {
        Err(format!(
            "docker pull failed: {}",
            String::from_utf8_lossy(&pull.stderr).trim()
        ))
    }
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
pub fn kittentts_start(state: State<'_, TtsServerState>, threads: Option<u32>) -> Result<String, String> {
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

    let paths = find_kittentts_paths();

    let script = paths.script.ok_or("KittenTTS server script not found")?;
    let python = paths.python.unwrap_or_else(|| "python3".to_string());

    let mut cmd = Command::new(&python);
    cmd.arg(&script);
    if let Some(t) = threads {
        if t > 0 {
            cmd.args(["--threads", &t.to_string()]);
        }
    }

    let child = cmd
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
