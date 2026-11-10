# Portfolio audit — November 10, 2026

Verified existing browser destinations by reading the served HTML:
- DBD Toolkit: https://dbdtoolkit.xyz (redirects into dbd-toolset/dbd-toolkit.html).
- Stardew Toolkit: https://0xsamantha.github.io/stardew-valley-toolkit/.
- TS Visualizer: https://0xsamantha.github.io/audio-visualizer/ (title TS Visualizer; demo, file, microphone modes). Opens externally so audio permissions and its own visual identity are preserved.
- Dragon Slayer: existing local game/game.html and existing managed game window.

Installable/source projects verified through public repository READMEs:
- https://github.com/0xSamantha/toolkit-builder#readme — Fieldkit, dependency-free reusable static toolkit source, not a verified hosted app.
- https://github.com/0xSamantha/dino-gesture-game#readme — local Python runner, credited MediaPipe gesture foundation, nine-class classifier; no personal model-training claim made.
- https://github.com/0xSamantha/digital-midi#readme — Python/Qt instrument with MediaPipe/OpenCV tracking and MIDI/audio outputs.
- https://github.com/0xSamantha/gc-digital-instrument#readme — AIR, custom mappings/synthesis using MediaPipe hand landmarks and OpenCV.

Previous About-only project names (LP Burn Tracker, NFT/Coin Home Page, Bitcoin Price Predictor, Disneyland Trip Checklist) had no launch/setup destinations in this checkout. They were replaced with verified examples rather than invented links or browser-ready claims. No source folders were moved. The local app.py is incomplete without model/utils files, so links point to maintained repositories instead.

No legacy coin wording found in external handles or destinations. Formspree endpoint and existing social links preserved. No verified email address was present to add.

Font audit: no local font files; VT323 import requests its regular face only. Existing 98.css also supplies pixel typography. The final CSS block makes longer About, project, and Contact copy regular Arial 14px with 1.5 line height, leaving the existing desktop/title system and MySpace decoration intact. No unsupported lighter weight requested. Browser host unavailable, so no rendered before/after or desktop/mobile visual QA was possible.

Validation: four backend tests (100 concurrent atomic increments, persistence, rate-limit recovery, request validation); JS syntax; HTML navigation target/ID/asset checks; three consistent visualizer URLs; coin copy audit; git diff whitespace check. Live device interaction, browser console, visual layout, and production proxy remain unverified. No publication/deployment performed.
