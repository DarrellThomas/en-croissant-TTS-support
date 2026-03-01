# Setting Up ElevenLabs

*Back to the [TTS Guide](tts-guide.md)*

ElevenLabs produces the highest quality voices available — expressive, human-like speech with real personality. Setup takes about 2 minutes.

## Free Tier

ElevenLabs gives you 10,000 characters per month for free. A typical annotated game uses 2,000-4,000 characters, so you can review 2-5 games per month at no cost. If you find TTS valuable:

- **Starter** — $5/month, 30,000 characters (solid upgrade)
- **Pro** — $22/month, 100,000 characters (heavy use)

## Step 1: Create an Account

1. Go to **[elevenlabs.io](https://elevenlabs.io/)**
2. Click **Sign Up** in the top right
3. You can sign up with Google, GitHub, or email — pick whatever's easiest
4. After signing up, you'll land on the ElevenLabs dashboard

## Step 2: Get Your API Key

1. In the bottom-left corner of the dashboard, click your **profile icon** (or your name)
2. Click **Profile + API key**
3. You'll see an API key section. Click **Reveal** to show your key, or **Generate** if you don't have one yet
4. The key looks like: `sk_...about 30 characters...`
5. **Click the copy icon** to copy it to your clipboard

## Step 3: Configure En Parlant~

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Scroll down to the TTS section
3. Set **TTS Provider** to **ElevenLabs**
4. Click inside the **ElevenLabs API Key** field and paste your key (Ctrl+V)
5. The **TTS Voice** dropdown will populate with your available voices. **Adam** is a great default — clear, natural, and works well for chess commentary
6. Set **Text-to-Speech** to **On**
7. Click the **Test** button next to the voice selector

You should hear a chess move spoken aloud. If you do — you're all set!

## Troubleshooting

- **No sound after clicking Test?** Make sure you pasted the full API key. Try clicking **Generate** again on the ElevenLabs website to get a fresh key.
- **"Unauthorized" error?** Your API key may have expired or been revoked. Generate a new one from your ElevenLabs profile.
- **Voices not loading in the dropdown?** Check your internet connection. The voice list is fetched from ElevenLabs servers.
- **Running out of characters quickly?** The character count includes all text sent to ElevenLabs, including chess move notation. Use the TTS Audio Cache — once a phrase is generated, it's cached locally and doesn't use characters again.

## Voice Tips

ElevenLabs has dozens of voices. Some favorites for chess narration:

- **Adam** — clear, professional, neutral tone
- **Antoni** — warm, slightly accented, engaging
- **Bella** — expressive female voice, great for dramatic annotations
- **Elli** — calm female voice, good for study sessions

Browse the full list in the TTS Voice dropdown. Each voice has its own personality.
