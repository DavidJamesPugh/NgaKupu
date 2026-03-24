import type { ImageSourcePropType } from 'react-native';

export type QuestionCategory =
  | 'written-vocabulary'
  | 'listening-vocabulary'
  | 'written-comprehension'
  | 'listening-comprehension';

export type QuestionKind = 'multiple-choice' | 'free-response' | 'audio' | 'word-match';

export interface QuestionBase {
  /**
   * Unique identifier so that progress can be tracked or persisted.
   */
  id: string;
  /**
   * Determines how the question should be rendered.
   */
  kind: QuestionKind;
  /**
   * Instructional text displayed above the prompt.
   */
  prompt: string;
  /**
   * Optional supporting context or English translation for clarity.
   */
  context?: string;
  /**
   * Lightweight difficulty tag for ordering or filtering.
   */
  difficulty?: 'tamariki' | 'tauira' | 'matua' | 'tohunga';
  /**
   * Learning modality classification (vocabulary/comprehension, written/listening).
   */
  category: QuestionCategory;
}

export interface MultipleChoiceOption {
  id: string;
  /**
   * Value that will replace the blank in the sentence.
   */
  value: string;
  /**
   * Optional helper shown beneath the option
   * (e.g. literal translation or usage hint).
   */
  helper?: string;
  image?: ImageSourcePropType;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  kind: 'multiple-choice';
  /**
   * Māori sentence displayed to the learner.
   * Use `___` to indicate the blank to be filled.
   */
  sentence: string;
  options: MultipleChoiceOption[];
  /**
   * The `id` of the correct option in `options`.
   */
  correctOptionId: string;
  /**
   * Optional full translation for feedback after answering.
   */
  translation?: string;
}

export interface FreeResponseQuestion extends QuestionBase {
  kind: 'free-response';
  /**
   * Māori (or English) sentence to translate.
   */
  sentence: string;
  /**
   * Acceptable answers in lowercase form to simplify matching.
   */
  acceptableAnswers: string[];
  /**
   * Optional exemplar answer displayed after submission.
   */
  exemplar?: string;
}

export interface AudioPromptQuestion extends QuestionBase {
  kind: 'audio';
  /**
   * Source for the recorded kupu or rerenga kōrero.
   */
  audio: {
    uri: string;
    /**
     * If the audio is bundled locally, specify the module ID.
     * (During bootstrap we only provide a string placeholder.)
     */
    type: 'remote' | 'local';
  };
  /**
   * Transcript of the spoken phrase to assist debugging and accessibility.
   */
  transcript: string;
  /**
   * Acceptable answers, mirroring free-response logic for now.
   */
  acceptableAnswers: string[];
  /**
   * Whether the UI should treat this as a selection-based response.
   * For now we default to free text until audio options are ready.
   */
  responseMode?: 'free-response' | 'multiple-choice';
}

export interface WordMatchQuestion extends QuestionBase {
  kind: 'word-match';
  /**
   * The word shown to the learner.
   */
  sourceText: string;
  /**
   * Which language the source word is in (for labelling the UI).
   */
  sourceLanguage: 'maori' | 'english';
  options: MultipleChoiceOption[];
  correctOptionId: string;
  image?: ImageSourcePropType;
  audio?: number | { uri: string };
}

export type Question =
  | MultipleChoiceQuestion
  | FreeResponseQuestion
  | AudioPromptQuestion
  | WordMatchQuestion;

export const isMultipleChoiceQuestion = (
  question: Question,
): question is MultipleChoiceQuestion => question.kind === 'multiple-choice';

export const isWordMatchQuestion = (
  question: Question,
): question is WordMatchQuestion => question.kind === 'word-match';

export const isFreeResponseQuestion = (
  question: Question,
): question is FreeResponseQuestion => question.kind === 'free-response';

export const isAudioPromptQuestion = (
  question: Question,
): question is AudioPromptQuestion => question.kind === 'audio';
