# Setting Up Google Cloud TTS

*Back to the [TTS Guide](tts-guide.md)*

Google Cloud TTS uses WaveNet neural networks to generate natural-sounding speech. The free tier is very generous — one million characters per month. This walkthrough takes about 5 minutes.

## What You Need

A Google account (the same one you use for Gmail or YouTube works fine). You'll need to add a payment method, but **you will not be charged** unless you exceed 1 million characters in a month. That's very hard to do with chess annotations.

## Step 1: Sign In to Google Cloud Console

1. Open your browser and go to **[console.cloud.google.com](https://console.cloud.google.com/)**
2. Sign in with your Google account
3. If this is your first time, Google will ask you to agree to the Terms of Service. Check the box and click **Agree and Continue**

You should now see the Google Cloud Console dashboard. It looks busy — don't worry, we only need two things from here.

## Step 2: Set Up Billing

Google requires a billing account even for their free tier. You will not be charged for normal chess study use.

1. In the top search bar, type **"Billing"** and click **Billing** in the dropdown
2. Click **Link a billing account** (or **Create account** if you don't have one yet)
3. Follow the prompts to add a credit card or debit card
4. Once complete, you'll see a green checkmark next to your billing account

> **Note:** If you already have Google Cloud billing set up from another project, you can skip this step. Your existing billing account works fine.

## Step 3: Enable the Text-to-Speech API

This tells Google which service you want to use.

1. In the top search bar, type **"Text-to-Speech"**
2. In the dropdown results, click **Cloud Text-to-Speech API** (it has a blue API icon)
3. You'll land on the API details page. Click the big blue **Enable** button
4. Wait a few seconds. When the button changes to **Manage**, the API is enabled

## Step 4: Create an API Key

The API key is what En Parlant~ uses to talk to Google's servers.

1. In the top search bar, type **"Credentials"** and click **Credentials** under "APIs & Services"
2. Near the top of the page, click **+ Create Credentials**
3. From the dropdown, select **API key**
4. A dialog pops up showing your new key. It looks something like: `AIzaSyC...about 35 characters...`
5. **Click the copy icon** next to the key to copy it to your clipboard
6. Click **Close**

### Recommended: Restrict Your Key

After creating the key, you'll see it listed on the Credentials page. Click the key name to open its settings:

1. Under **API restrictions**, select **Restrict key**
2. Choose **Cloud Text-to-Speech API** from the dropdown
3. Click **Save**

This means even if someone gets your key, they can only use it for TTS — nothing else.

## Step 5: Configure En Parlant~

Almost there!

1. Open En Parlant~ and go to **Settings** (gear icon) > **Sound** tab
2. Scroll down to the TTS section
3. Set **TTS Provider** to **Google Cloud**
4. Click inside the **Google Cloud API Key** field and paste your key (Ctrl+V)
5. Set **Text-to-Speech** to **On**
6. Click the **Test** button next to the voice selector

You should hear a chess move spoken aloud. If you do — congratulations, you're set up!

## Troubleshooting

- **Test is silent?** Double-check that (1) you pasted the full API key, (2) the Text-to-Speech API is enabled (Step 3), and (3) billing is linked (Step 2). The most common issue is forgetting to enable the API.
- **"API key not valid" error?** Make sure you copied the key correctly — no extra spaces. If you restricted the key, verify that Cloud Text-to-Speech API is in the allowed list.
- **"Billing account not found" error?** Go back to Step 2 and make sure billing is linked to your project.
- **Voices sound different than expected?** En Parlant~ uses WaveNet voices by default. The voice gender can be changed in Settings > Sound > Google Voice Gender.

## Cost

Google's free tier covers 1 million characters per month of WaveNet voices. A heavily annotated game uses roughly 3,000-5,000 characters. At that rate, you could study 200-300 games per month before hitting the limit. Google shows you a usage warning well before any charges apply.
