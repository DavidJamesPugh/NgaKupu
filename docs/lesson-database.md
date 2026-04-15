# Lesson Database (SQLite)

The app now uses a **bundled prebuilt SQLite database** and copies it into the app's writable SQLite directory on first launch.

## Why

- Preload lesson content so users have offline-ready sentence data.
- Support both:
  - template-driven sentence generation (`templates` table)
  - authored complex sentences that do not depend on templates (`complex_sentences` table)
- Store audio references by key (`audio_assets`) so question types can link to bundled or remote audio.

## Startup

Database initialization runs in `app/_layout.tsx` via:

- `initializeLessonDatabase()`

This function:

1. Copies bundled `assets/database/ngakupu_lessons.db` to `${documentDirectory}/SQLite/ngakupu_lessons.db` if missing.
2. Opens SQLite and runs schema checks/migrations.
3. Applies seed fallback only when schema/version requires it.

## Generate bundled DB

The bundled `.db` file is generated from `tools/generateBundledDb.mjs`.

- Run: `pnpm db:bundle`
- Output: `assets/database/ngakupu_lessons.db`

## Current schema

- `app_meta` - schema versioning and migration checks
- `audio_assets` - audio keys + transcript + local/remote pointers
- `templates` - reusable bilingual sentence patterns + guide notes
- `complex_sentences` - authored bilingual sentences + guides + phrase matching metadata
- `vocabulary_concepts` - one row per concept with `english_text`, `maori_text`, shared image key, and optional Māori audio key
- `vocabulary_lessons` - lesson-level prompt/answer/difficulty config for word-match generation
- `word_order_lessons` - tile-order sentence construction lesson definitions

## Asset strategy

- Database stores `audio_asset_key` / `image_asset_key` and metadata.
- Runtime maps keys to RN-safe bundled/remote sources via `src/data/db/assetRegistry.ts`.
- `src/data/db/assetRegistry.ts` is generated from `src/data/db/assetRegistry.config.json`.

This keeps SQL records portable while still supporting `require(...)` for local assets.

## Validation

- Run `pnpm db:validate` to verify:
  - every DB `image_asset_key`/`audio_asset_key` exists in asset config
  - every vocabulary concept has both `maori` and `english` text
  - sentence records have enough sentence-shaped distractors

The runtime question set is now DB-derived for vocabulary lessons, sentence translation/listening content, and word-order lessons.

## Next integration steps

1. Add slot/lexeme tables for constrained template filling.
2. Add query helpers that build question objects from DB rows.
3. Migrate selected hardcoded lessons into `complex_sentences`.
