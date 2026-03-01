use serde::Serialize;
use specta::Type;
use std::sync::Mutex;
use tts::Tts;

pub struct SystemTtsState(pub Mutex<Option<Tts>>);

#[derive(Serialize, Type)]
pub struct SystemVoice {
    pub id: String,
    pub name: String,
    pub language: String,
}

fn get_or_init_tts(state: &Mutex<Option<Tts>>) -> Result<std::sync::MutexGuard<'_, Option<Tts>>, String> {
    let mut guard = state.lock().map_err(|e| format!("TTS lock error: {e}"))?;
    if guard.is_none() {
        let engine = Tts::default().map_err(|e| format!("Failed to initialize system TTS: {e}"))?;
        *guard = Some(engine);
    }
    Ok(guard)
}

#[tauri::command]
#[specta::specta]
pub fn system_tts_speak(
    state: tauri::State<'_, SystemTtsState>,
    text: String,
    rate: Option<f32>,
    volume: Option<f32>,
    pitch: Option<f32>,
) -> Result<(), String> {
    let mut guard = get_or_init_tts(&state.0)?;
    let tts = guard.as_mut().ok_or("TTS not initialized")?;

    // Rate is normalized 0.5-2.0 from the frontend (1.0 = normal).
    // Map it to the platform's actual range using the crate's own bounds.
    if let Some(r) = rate {
        let normal = tts.normal_rate();
        let platform_rate = if r <= 1.0 {
            // Slower: interpolate between min_rate and normal_rate
            let min = tts.min_rate();
            min + (normal - min) * r
        } else {
            // Faster: interpolate between normal_rate and max_rate
            let max = tts.max_rate();
            normal + (max - normal) * (r - 1.0)
        };
        let _ = tts.set_rate(platform_rate);
    }
    if let Some(v) = volume {
        // Volume is 0.0-1.0 from frontend, map to platform range
        let min = tts.min_volume();
        let max = tts.max_volume();
        let _ = tts.set_volume(min + (max - min) * v);
    }
    if let Some(p) = pitch {
        let _ = tts.set_pitch(p);
    }

    tts.speak(text, true).map_err(|e| format!("TTS speak error: {e}"))?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn system_tts_stop(
    state: tauri::State<'_, SystemTtsState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| format!("TTS lock error: {e}"))?;
    if let Some(tts) = guard.as_mut() {
        let _ = tts.stop();
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn system_tts_list_voices(
    state: tauri::State<'_, SystemTtsState>,
) -> Result<Vec<SystemVoice>, String> {
    let mut guard = get_or_init_tts(&state.0)?;
    let tts = guard.as_mut().ok_or("TTS not initialized")?;

    let voices = tts.voices().map_err(|e| format!("Failed to list voices: {e}"))?;
    Ok(voices
        .into_iter()
        .map(|v| SystemVoice {
            id: v.id().to_string(),
            name: v.name().to_string(),
            language: v.language().to_string(),
        })
        .collect())
}

#[tauri::command]
#[specta::specta]
pub fn system_tts_set_voice(
    state: tauri::State<'_, SystemTtsState>,
    voice_id: String,
) -> Result<(), String> {
    let mut guard = get_or_init_tts(&state.0)?;
    let tts = guard.as_mut().ok_or("TTS not initialized")?;

    let voices = tts.voices().map_err(|e| format!("Failed to list voices: {e}"))?;
    if let Some(voice) = voices.into_iter().find(|v| v.id() == voice_id) {
        tts.set_voice(&voice).map_err(|e| format!("Failed to set voice: {e}"))?;
    }
    Ok(())
}
