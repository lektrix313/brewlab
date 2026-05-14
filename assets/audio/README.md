# ElevenLabs Voice Setup

## Generate the welcome audio

1. Go to https://elevenlabs.io/app/speech-synthesis
2. Pick a voice. Recommended:
   - **Adam** — Warm British male, perfect for "knowledgeable brewing mate"
   - **Bella** — Soft British female, equally good
   - **Charlie** — Energetic, younger vibe
3. Paste this exact text:
   ```
   Welcome to Brew Lab.
   ```
4. Settings:
   - Stability: 0.5
   - Clarity + Similarity Enhancement: 0.75
   - Style: 0.3 (slight emphasis)
5. Generate and download as MP3
6. Rename to `welcome.mp3` and place in this folder (`assets/audio/`)
7. Rebuild the app

## Alternative: API script

If you have an ElevenLabs API key:

```bash
curl -X POST https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to Brew Lab.",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75,
      "style": 0.3
    }
  }' \
  --output assets/audio/welcome.mp3
```

Voice IDs:
- Adam: `pNInz6obpgDQGcFmaJgB`
- Bella: `EXAVITQu4vr4xnSDxMaL`
- Charlie: `IKne3meq5aSn9XLyUdCD`
