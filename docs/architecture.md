## Overview

The NgaKupu mobile app is an Expo-managed React Native project focused on Te Reo Māori language learning. Learners interact with short sentence-based exercises that reinforce vocabulary and sentence structure through different question formats:
- Fill-in-the-blank multiple choice prompts.
- Free-form translation tasks where the user types an answer.
- Audio-driven prompts (future) where learners listen to spoken phrases and respond via selection or text.

## Question Model

Questions share common properties including an identifier, prompt text, optional contextual translation, and scoring metadata. Three primary variants extend the shared shape:

- **MultipleChoiceQuestion**: Contains a sentence with a token placeholder (e.g. `___`) and multiple answer options. Each option can provide supporting text and access to hints.
- **FreeResponseQuestion**: Presents a sentence and expects the learner to type an equivalent sentence or translation. Correct answers may include multiple acceptable strings.
- **AudioPromptQuestion**: References an audio source (local asset or remote URL) that the learner listens to before supplying an answer. Initial implementation focuses on the display layer with audio playback added later through Expo AV.

Questions are organized into lightweight sets so that mixed practice sessions can pull from several types in a single flow.

## UI and Navigation

The app uses Expo Router tab navigation with the following top-level destinations:
- `Practice` tab: Primary learning surface that cycles through questions, renders the correct card component for each type, accepts answers, and provides feedback.
- `About` tab: Placeholder for project context, acknowledgements, and future instructions for learners.

Each question type maps to a reusable card component housed under `src/components/`. Cards are responsible for presenting prompts, collecting responses, and triggering callbacks when the learner submits an answer.

## Session Flow

Session management logic (implemented via a custom hook) performs these steps:
1. Load a shuffled array of questions from the sample dataset.
2. Track the learner’s position, accepted answers, and aggregate score.
3. Validate each submission, produce success/failure feedback, and advance to the next question when appropriate.
4. Expose utility methods so UI layers can trigger retries, skip questions, or restart the sequence.

Feedback messaging is lightweight in the first iteration (simple banners). Future revisions can layer in streak tracking, spaced repetition, and adaptive difficulty.

## Audio Roadmap

Audio prompts will rely on Expo AV once assets and recordings are available. Interim work includes:
- Stubbing the playback utility in `src/utils/audio.ts` with a `playAudio` helper that currently logs a TODO.
- Designing storage for local bundled audio with fallbacks for remote streaming URLs.
- Documenting how transcription or captions might accompany audio prompts for accessibility.

## Future Enhancements

- Store question data remotely to enable frequent content updates without app releases.
- Support Māori macrons and keyboard guidance in the free response field.
- Capture analytics on per-question performance to personalize practice sessions.
- Add spaced repetition scheduling and streak-based rewards for daily practice.
