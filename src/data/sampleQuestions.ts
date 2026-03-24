import type {
  AudioPromptQuestion,
  FreeResponseQuestion,
  MultipleChoiceQuestion,
  Question,
} from '../types/Question';

const multipleChoiceQuestions: MultipleChoiceQuestion[] = [
  {
    id: 'mc-ki-te-hikoi',
    kind: 'multiple-choice',
    prompt: 'Kōwhiria te kupu tika hei whakakī i te rerenga kōrero.',
    sentence: 'I haere au ki te ___.',
    options: [
      { id: 'option-a', value: 'maunga', helper: 'mountain' },
      { id: 'option-b', value: 'moana', helper: 'ocean/sea' },
      { id: 'option-c', value: 'toenga', helper: 'leftovers' },
    ],
    correctOptionId: 'option-b',
    translation: 'I went to the ocean.',
    difficulty: 'tauira',
  },
  {
    id: 'mc-haere-ki-te-whare',
    kind: 'multiple-choice',
    prompt: 'Whiriwhiria te kupu e hāngai ana ki te horopaki.',
    sentence: 'Kei te haere au ki te ___.',
    options: [
      { id: 'option-a', value: 'whare', helper: 'house' },
      { id: 'option-b', value: 'pounamu', helper: 'greenstone' },
      { id: 'option-c', value: 'kaiako', helper: 'teacher' },
    ],
    correctOptionId: 'option-a',
    translation: 'I am going to the house.',
    difficulty: 'tamariki',
  },
];

const freeResponseQuestions: FreeResponseQuestion[] = [
  {
    id: 'fr-te-reo-translation',
    kind: 'free-response',
    prompt: 'Whakamāoritia te rerenga kōrero.',
    sentence: 'I am learning Te Reo Māori.',
    acceptableAnswers: [
      'e ako ana au i te reo māori',
      'kei te ako au i te reo māori',
    ],
    exemplar: 'Kei te ako au i te Reo Māori.',
    difficulty: 'tauira',
  },
  {
    id: 'fr-where-are-you-going',
    kind: 'free-response',
    prompt: 'Whakamāoritia te rerenga kōrero.',
    sentence: 'Where are you going?',
    acceptableAnswers: [
      'kei te haere koe ki hea',
      'keihea koe e haere ana',
    ],
    exemplar: 'Kei te haere koe ki hea?',
    difficulty: 'tamariki',
  },
];

const audioPromptQuestions: AudioPromptQuestion[] = [
  {
    id: 'audio-kei-te-haere',
    kind: 'audio',
    prompt: 'Whakarongo ki te kōrero ka tuhi i te whakamāoritanga.',
    audio: {
      uri: 'https://example.com/audio/kei-te-haere-i-te-whare.mp3',
      type: 'remote',
    },
    transcript: 'Kei te haere i te whare.',
    acceptableAnswers: [
      'going through the house',
      'i am going through the house',
      'i am travelling through the house',
    ],
    responseMode: 'free-response',
    context: 'Ka rongohia tētahi tangata e kōrero ana mō tōna haerenga.',
    difficulty: 'tauira',
  },
];

export const SAMPLE_QUESTIONS: Question[] = [
  ...multipleChoiceQuestions,
  ...freeResponseQuestions,
  ...audioPromptQuestions,
];
