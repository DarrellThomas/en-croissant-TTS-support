#!/usr/bin/env python3
"""
KittenTTS HTTP Server for En Croissant-TTS

A lightweight HTTP wrapper around KittenTTS that exposes a simple REST API
for text-to-speech synthesis. En Croissant-TTS connects to this server
when "KittenTTS" is selected as the TTS provider.

Setup:
    python -m venv .venv
    .venv/bin/pip install kittentts flask soundfile numpy

Usage:
    .venv/bin/python kittentts-server.py                # default: port 8192
    .venv/bin/python kittentts-server.py --port 9000    # custom port

The nano model (~25MB) downloads automatically from HuggingFace on first run.

Voices: Voice 2M, Voice 2F, Voice 3M, Voice 3F, Voice 4M, Voice 4F, Voice 5M, Voice 5F
"""

import argparse
import io
import sys

try:
    from flask import Flask, request, jsonify, send_file
except ImportError:
    print("Flask not installed. Run: pip install flask")
    sys.exit(1)

try:
    from kittentts import KittenTTS
except ImportError:
    print("KittenTTS not installed. Run: pip install kittentts")
    sys.exit(1)

try:
    import soundfile as sf
    import numpy as np
except ImportError:
    print("soundfile/numpy not installed. Run: pip install soundfile numpy")
    sys.exit(1)

# Voice IDs as defined by KittenTTS library, with friendly display names
VOICE_MAP = {
    "expr-voice-2-m": "Voice 2 (Male)",
    "expr-voice-2-f": "Voice 2 (Female)",
    "expr-voice-3-m": "Voice 3 (Male)",
    "expr-voice-3-f": "Voice 3 (Female)",
    "expr-voice-4-m": "Voice 4 (Male)",
    "expr-voice-4-f": "Voice 4 (Female)",
    "expr-voice-5-m": "Voice 5 (Male)",
    "expr-voice-5-f": "Voice 5 (Female)",
}

app = Flask(__name__)
model = None


@app.route("/api/tts", methods=["GET", "POST"])
def tts():
    text = request.args.get("text", "") or request.get_data(as_text=True)
    voice = request.args.get("voice", "expr-voice-2-m")
    speed = float(request.args.get("speed", "1.0"))

    if not text:
        return "Missing 'text' parameter", 400
    if voice not in VOICE_MAP:
        return f"Unknown voice '{voice}'. Available: {', '.join(VOICE_MAP.keys())}", 400

    try:
        audio = model.generate(text, voice=voice, speed=speed)
        buf = io.BytesIO()
        sf.write(buf, audio, 24000, format="WAV")
        buf.seek(0)
        return send_file(buf, mimetype="audio/wav")
    except Exception as e:
        return f"TTS generation error: {e}", 500


@app.route("/api/voices", methods=["GET"])
def voices():
    return jsonify(
        {
            vid: {"name": name, "language": "en", "tts_name": "kittentts"}
            for vid, name in VOICE_MAP.items()
        }
    )


def main():
    global model

    parser = argparse.ArgumentParser(description="KittenTTS HTTP Server")
    parser.add_argument("--port", type=int, default=8192, help="Port (default: 8192)")
    parser.add_argument("--host", default="127.0.0.1", help="Host (default: 127.0.0.1)")
    parser.add_argument("--threads", type=int, default=0, help="CPU threads for PyTorch (0 = auto)")
    args = parser.parse_args()

    if args.threads > 0:
        try:
            import torch
            torch.set_num_threads(args.threads)
            print(f"PyTorch threads set to {args.threads}")
        except ImportError:
            pass  # torch is a transitive dep of kittentts, but guard anyway

    print("Loading KittenTTS nano model...")
    print("(First run downloads from HuggingFace — this may take a moment)")
    model = KittenTTS()
    print(f"Model loaded. Starting server on {args.host}:{args.port}")
    print(f"Voices: {', '.join(VOICE_MAP.values())}")
    print(f"API: http://{args.host}:{args.port}/api/tts?text=Hello&voice=expr-voice-2-m")

    app.run(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
