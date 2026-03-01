# Setting Up System TTS

*Back to the [TTS Guide](../en/tts-guide.md)*

System TTS uses your operating system's built-in speech synthesis. There is nothing to install — it works immediately.

**Fair warning:** System TTS is free and easy, and you get what you pay for. The voice quality is genuinely bad on most platforms — robotic, flat, and sometimes hard to follow during longer annotations. It's fine for a quick test to see how TTS narration works, but if you plan to actually study with it, you'll want to switch to literally any other provider. Even the free tiers of Google Cloud and ElevenLabs are dramatically better.

## Configure En Parlant~

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Set **TTS Provider** to **System (OS Native)**
3. The voice dropdown shows all voices available on your system
4. Click the **Test** button to preview

That's it. System TTS works immediately with no setup.

## Voice Quality by OS

System voices vary significantly by operating system:

- **macOS** — the most natural system voices. Apple's newer voices (like Samantha Enhanced) are quite good.
- **Windows** — SAPI voices are decent. Windows 10+ includes some neural voices that sound better than the classic ones.
- **Linux** — typically eSpeak or Festival via speech-dispatcher. More robotic than macOS or Windows, but functional.

If you find the quality too basic, consider upgrading to KittenTTS (local, free), Google Cloud, or ElevenLabs.

## Installing More Voices on Linux

Linux systems often start with just one or two eSpeak voices. You can add more:

```bash
# Install all eSpeak language data
sudo apt install espeak-ng-data-*

# Install Festival voices
sudo apt install festvox-*

# Install speech-dispatcher voices
sudo apt install speech-dispatcher-*
```

After installing new voices, restart En Parlant~ to see them in the voice dropdown.

## Language Support

Available languages depend on your OS and installed voice packs. System TTS will use whatever voices your operating system provides. For comprehensive multi-language support, use ElevenLabs or Google Cloud instead.

## Troubleshooting

- **No voices in dropdown?** On Linux, make sure speech-dispatcher is installed: `sudo apt install speech-dispatcher`
- **Voice sounds garbled?** Try a different voice from the dropdown. Some system voices work better than others.
- **No sound at all?** Check your system audio settings. System TTS uses your default audio output device.
