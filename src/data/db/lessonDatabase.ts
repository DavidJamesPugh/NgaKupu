import { Asset } from 'expo-asset';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import type { QuestionCategory } from '../../types/Question';

type DifficultyTag = 'tamariki' | 'tauira' | 'matua' | 'tohunga';

interface AudioSeed {
  assetKey: string;
  transcript: string;
  localPath?: string;
  remoteUri?: string;
}

interface TemplateSeed {
  slug: string;
  title: string;
  maoriPattern: string;
  englishPattern: string;
  difficulty: DifficultyTag;
  category: QuestionCategory;
  lessonGuide: string[];
}

interface ComplexSentenceSeed {
  slug: string;
  maoriText: string;
  englishText: string;
  difficulty: DifficultyTag;
  category: QuestionCategory;
  sourceType: 'template' | 'authored';
  audioAssetKey?: string;
  lessonGuide: string[];
  phraseMatches: { source: string; target: string }[];
}

interface VocabularyConceptSeed {
  conceptKey: string;
  englishText: string;
  maoriText: string;
  englishHelper?: string;
  maoriHelper?: string;
  imageAssetKey?: string;
  /** Always Māori audio for this app's design. */
  audioAssetKey?: string;
}

interface VocabularyLessonSeed {
  lessonId: string;
  prompt: string;
  difficulty: DifficultyTag;
  answerConceptKey: string;
  optionsLanguage: 'maori' | 'english';
  sourceLanguage: 'maori' | 'english';
  sourceText?: string;
  transcript?: string;
  optionCount?: number;
  categoryOverride?: QuestionCategory;
  useAnswerImage?: boolean;
  imageAssetKey?: string;
  audioAssetKey?: string;
  lessonGuide: string[];
}

interface WordOrderLessonSeed {
  lessonId: string;
  prompt: string;
  sourceText: string;
  sourceLanguage: 'maori' | 'english';
  tiles: { id: string; value: string }[];
  correctSequenceIds: string[];
  phraseMatches?: { source: string; target: string }[];
  difficulty: DifficultyTag;
  category?: QuestionCategory;
  lessonGuide?: string[];
}

const DB_NAME = 'ngakupu_lessons.db';
const SCHEMA_VERSION = 6;
const APP_META_KEY = 'schema_version';
const BUNDLED_DB_ASSET = require('../../../assets/database/ngakupu_lessons.db');
const SQLITE_DIR = `${LegacyFileSystem.documentDirectory}SQLite`;
const DB_FILE_PATH = `${SQLITE_DIR}/${DB_NAME}`;

const audioSeeds: AudioSeed[] = [
  {
    assetKey: 'audio.whetu.local',
    transcript: 'Whetū',
    localPath: 'assets/audio/whetu.mp3',
  },
  {
    assetKey: 'audio.enoho.local',
    transcript: 'E noho rā',
    localPath: 'assets/audio/e-noho-ra.mp3',
  },
];

const templateSeeds: TemplateSeed[] = [
  {
    slug: 'kei-te-verb-subject',
    title: 'Present Continuous',
    maoriPattern: 'Kei te {verb} {subject}',
    englishPattern: '{subject_en} is {verb_ing}',
    difficulty: 'tauira',
    category: 'written-comprehension',
    lessonGuide: ['Kei te marks ongoing action.', 'Subject follows the verb phrase in this template.'],
  },
  {
    slug: 'i-haere-ki-te-place',
    title: 'Past Movement',
    maoriPattern: '{subject} i haere ki te {place}',
    englishPattern: '{subject_en} went to the {place_en}',
    difficulty: 'tamariki',
    category: 'written-comprehension',
    lessonGuide: ['I haere expresses past movement.', 'Ki te means "to the".'],
  },
];

const complexSentenceSeeds: ComplexSentenceSeed[] = [
  {
    slug: 'ducks-forest',
    maoriText: 'Ngā rakiraki i haere ki te ngahere.',
    englishText: 'The ducks went to the forest.',
    difficulty: 'tamariki',
    category: 'written-comprehension',
    sourceType: 'authored',
    lessonGuide: ['Ngā indicates plural noun phrase.', 'Ki te ngahere = to the forest.'],
    phraseMatches: [
      { source: 'Ngā rakiraki', target: 'The ducks' },
      { source: 'i haere', target: 'went' },
      { source: 'ki te ngahere', target: 'to the forest' },
    ],
  },
  {
    slug: 'children-park',
    maoriText: 'Kei te tākaro ngā tamariki i te pāka.',
    englishText: 'The children are playing in the park.',
    difficulty: 'tauira',
    category: 'written-comprehension',
    sourceType: 'authored',
    lessonGuide: ['Kei te + verb marks present continuous.', 'I te pāka = in the park.'],
    phraseMatches: [
      { source: 'Kei te tākaro', target: 'are playing' },
      { source: 'ngā tamariki', target: 'the children' },
      { source: 'i te pāka', target: 'in the park' },
    ],
  },
  {
    slug: 'cat-sleeping-house',
    maoriText: 'Kei te moe te ngeru i te whare.',
    englishText: 'The cat is sleeping in the house.',
    difficulty: 'tamariki',
    category: 'written-comprehension',
    sourceType: 'authored',
    lessonGuide: ['Kei te + verb marks ongoing action.', 'I te whare = in the house.'],
    phraseMatches: [
      { source: 'Kei te moe', target: 'is sleeping' },
      { source: 'te ngeru', target: 'the cat' },
      { source: 'i te whare', target: 'in the house' },
    ],
  },
];

const vocabularyConceptSeeds: VocabularyConceptSeed[] = [
  {
    conceptKey: 'octopus',
    englishText: 'Octopus',
    maoriText: 'Wheke',
    imageAssetKey: 'image.octopus.local',
  },
  {
    conceptKey: 'star',
    englishText: 'Star',
    maoriText: 'Whetū',
    imageAssetKey: 'image.star.local',
    audioAssetKey: 'audio.whetu.local',
  },
  {
    conceptKey: 'cat',
    englishText: 'Cat',
    maoriText: 'Ngeru',
    imageAssetKey: 'image.cat.local',
  },
  {
    conceptKey: 'bird',
    englishText: 'Bird',
    maoriText: 'Manu',
    imageAssetKey: 'image.bird.remote',
  },
  {
    conceptKey: 'farewell',
    englishText: 'Goodbye (To someone staying)',
    maoriText: 'E noho rā',
    imageAssetKey: 'image.farewell.remote',
    audioAssetKey: 'audio.enoho.local',
  },
  {
    conceptKey: 'greeting',
    englishText: 'Hello',
    maoriText: 'Kia ora',
    imageAssetKey: 'image.greeting.remote',
  },
];

const vocabularyLessonSeeds: VocabularyLessonSeed[] = [
  {
    lessonId: 'lesson-octopus',
    prompt: 'He aha tēnei kararehe?',
    difficulty: 'tamariki',
    answerConceptKey: 'octopus',
    optionsLanguage: 'maori',
    sourceLanguage: 'english',
    sourceText: 'Octopus',
    optionCount: 3,
    useAnswerImage: true,
    lessonGuide: ['He aha... ? = What is...?', 'Choose the kupu that matches the image.'],
  },
  {
    lessonId: 'lesson-whetu-audio',
    prompt: 'Whakarongo ki te kupu ka kōwhiri i te whakamāoritanga tika.',
    difficulty: 'tamariki',
    answerConceptKey: 'star',
    optionsLanguage: 'english',
    sourceLanguage: 'maori',
    transcript: 'Whetū',
    optionCount: 3,
    audioAssetKey: 'audio.whetu.local',
    lessonGuide: ['Whakarongo = Listen.', 'Whetū = Star.'],
  },
  {
    lessonId: 'lesson-farewell-audio',
    prompt: 'Whakarongo ki te rerenga kōrero ka tīpako i te tikanga Ingarihi.',
    difficulty: 'tauira',
    answerConceptKey: 'farewell',
    optionsLanguage: 'english',
    sourceLanguage: 'maori',
    transcript: 'E noho rā',
    optionCount: 3,
    audioAssetKey: 'audio.enoho.local',
    lessonGuide: ['E noho rā = Goodbye (to someone staying).'],
  },
  {
    lessonId: 'lesson-cat',
    prompt: 'Choose the Māori kupu that matches the picture.',
    difficulty: 'tamariki',
    answerConceptKey: 'cat',
    optionsLanguage: 'maori',
    sourceLanguage: 'english',
    sourceText: 'Cat',
    optionCount: 3,
    useAnswerImage: true,
    lessonGuide: ['Choose the matching Māori word.', 'Ngeru = Cat.'],
  },
  {
    lessonId: 'lesson-greeting',
    prompt: 'Match the Māori greeting to the English meaning.',
    difficulty: 'tauira',
    answerConceptKey: 'greeting',
    optionsLanguage: 'english',
    sourceLanguage: 'maori',
    sourceText: 'Kia ora',
    optionCount: 3,
    lessonGuide: ['Kia ora = Hello / thanks / well-being greeting.'],
  },
];

const wordOrderLessonSeeds: WordOrderLessonSeed[] = [
  {
    lessonId: 'word-order-ducks-forest',
    prompt: 'Build the Māori translation from tiles.',
    sourceText: 'The ducks went to the forest.',
    sourceLanguage: 'english',
    tiles: [
      { id: 'nga', value: 'Ngā' },
      { id: 'rakiraki', value: 'rakiraki' },
      { id: 'i-haere', value: 'i haere' },
      { id: 'ki-te', value: 'ki te' },
      { id: 'ngahere', value: 'ngahere' },
      { id: 'whare', value: 'whare' },
    ],
    correctSequenceIds: ['nga', 'rakiraki', 'i-haere', 'ki-te', 'ngahere'],
    phraseMatches: [
      { source: 'The ducks', target: 'Ngā rakiraki' },
      { source: 'went', target: 'i haere' },
      { source: 'to the forest', target: 'ki te ngahere' },
    ],
    difficulty: 'tamariki',
    category: 'written-comprehension',
    lessonGuide: ['Ngā + noun gives plural subject.', 'Ki te + place gives destination.'],
  },
  {
    lessonId: 'word-order-children-park',
    prompt: 'Build the Māori translation from tiles.',
    sourceText: 'The children are playing in the park.',
    sourceLanguage: 'english',
    tiles: [
      { id: 'kei-te', value: 'Kei te' },
      { id: 'takaro', value: 'tākaro' },
      { id: 'nga', value: 'ngā' },
      { id: 'tamariki', value: 'tamariki' },
      { id: 'i-te', value: 'i te' },
      { id: 'paka', value: 'pāka' },
      { id: 'toa', value: 'toa' },
    ],
    correctSequenceIds: ['kei-te', 'takaro', 'nga', 'tamariki', 'i-te', 'paka'],
    phraseMatches: [
      { source: 'The children', target: 'ngā tamariki' },
      { source: 'are playing', target: 'Kei te tākaro' },
      { source: 'in the park', target: 'i te pāka' },
    ],
    difficulty: 'tauira',
    category: 'written-comprehension',
    lessonGuide: ['Kei te marks present ongoing action.', 'I te pāka = in the park.'],
  },
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | undefined;
let preloadPromise: Promise<void> | undefined;

const ensureBundledDatabaseCopied = async () => {
  if (Platform.OS === 'web') {
    return;
  }
  if (!preloadPromise) {
    preloadPromise = (async () => {
      if (!LegacyFileSystem.documentDirectory) {
        throw new Error('No document directory available for bundled database preload');
      }
      const info = await LegacyFileSystem.getInfoAsync(DB_FILE_PATH);
      if (info.exists) {
        return;
      }

      await LegacyFileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true });

      const asset = Asset.fromModule(BUNDLED_DB_ASSET);
      await asset.downloadAsync();
      if (!asset.localUri) {
        throw new Error('Bundled database asset could not be resolved');
      }

      await LegacyFileSystem.copyAsync({
        from: asset.localUri,
        to: DB_FILE_PATH,
      });
    })();
  }
  await preloadPromise;
};

const openDatabase = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      await ensureBundledDatabaseCopied();
      return SQLite.openDatabaseAsync(DB_NAME);
    })();
  }
  return dbPromise;
};

const execStatements = async (db: SQLite.SQLiteDatabase, statements: string[]) => {
  for (const statement of statements) {
    await db.execAsync(statement);
  }
};

const createSchema = async (db: SQLite.SQLiteDatabase) => {
  await execStatements(db, [
    `CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS audio_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_key TEXT UNIQUE NOT NULL,
      transcript TEXT NOT NULL,
      local_path TEXT,
      remote_uri TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      maori_pattern TEXT NOT NULL,
      english_pattern TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      category TEXT NOT NULL,
      lesson_guide_json TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS complex_sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      maori_text TEXT NOT NULL,
      english_text TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      category TEXT NOT NULL,
      source_type TEXT NOT NULL,
      audio_asset_key TEXT,
      lesson_guide_json TEXT NOT NULL,
      phrase_matches_json TEXT NOT NULL,
      FOREIGN KEY (audio_asset_key) REFERENCES audio_assets(asset_key)
    );`,
    `CREATE TABLE IF NOT EXISTS vocabulary_concepts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_key TEXT UNIQUE NOT NULL,
      english_text TEXT NOT NULL,
      maori_text TEXT NOT NULL,
      english_helper TEXT,
      maori_helper TEXT,
      image_asset_key TEXT,
      audio_asset_key TEXT,
      FOREIGN KEY (audio_asset_key) REFERENCES audio_assets(asset_key)
    );`,
    `CREATE TABLE IF NOT EXISTS vocabulary_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT UNIQUE NOT NULL,
      prompt TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      answer_concept_key TEXT NOT NULL,
      options_language TEXT NOT NULL,
      source_language TEXT NOT NULL,
      source_text TEXT,
      transcript TEXT,
      option_count INTEGER,
      category_override TEXT,
      use_answer_image INTEGER NOT NULL DEFAULT 0,
      image_asset_key TEXT,
      audio_asset_key TEXT,
      lesson_guide_json TEXT NOT NULL,
      FOREIGN KEY (answer_concept_key) REFERENCES vocabulary_concepts(concept_key),
      FOREIGN KEY (audio_asset_key) REFERENCES audio_assets(asset_key)
    );`,
    `CREATE TABLE IF NOT EXISTS word_order_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT UNIQUE NOT NULL,
      prompt TEXT NOT NULL,
      source_text TEXT NOT NULL,
      source_language TEXT NOT NULL,
      tiles_json TEXT NOT NULL,
      correct_sequence_ids_json TEXT NOT NULL,
      phrase_matches_json TEXT,
      difficulty TEXT NOT NULL,
      category TEXT,
      lesson_guide_json TEXT
    );`,
  ]);
};

const seedIfNeeded = async (db: SQLite.SQLiteDatabase) => {
  const meta = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [APP_META_KEY],
  );
  if (meta?.value === String(SCHEMA_VERSION)) {
    return;
  }

  // Rebuild vocab tables when schema changes so old column names don't block inserts.
  await execStatements(db, [
    'DROP TABLE IF EXISTS vocabulary_lessons;',
    'DROP TABLE IF EXISTS vocabulary_entries;',
    'DROP TABLE IF EXISTS vocabulary_concepts;',
  ]);
  await createSchema(db);

  await db.withExclusiveTransactionAsync(async () => {
    await db.execAsync('DELETE FROM audio_assets;');
    await db.execAsync('DELETE FROM templates;');
    await db.execAsync('DELETE FROM complex_sentences;');
    await db.execAsync('DELETE FROM vocabulary_concepts;');
    await db.execAsync('DELETE FROM vocabulary_lessons;');
    await db.execAsync('DELETE FROM word_order_lessons;');

    for (const audio of audioSeeds) {
      await db.runAsync(
        `INSERT INTO audio_assets (asset_key, transcript, local_path, remote_uri)
         VALUES (?, ?, ?, ?)`,
        [audio.assetKey, audio.transcript, audio.localPath ?? null, audio.remoteUri ?? null],
      );
    }

    for (const template of templateSeeds) {
      await db.runAsync(
        `INSERT INTO templates (
          slug, title, maori_pattern, english_pattern, difficulty, category, lesson_guide_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          template.slug,
          template.title,
          template.maoriPattern,
          template.englishPattern,
          template.difficulty,
          template.category,
          JSON.stringify(template.lessonGuide),
        ],
      );
    }

    for (const sentence of complexSentenceSeeds) {
      await db.runAsync(
        `INSERT INTO complex_sentences (
          slug, maori_text, english_text, difficulty, category, source_type,
          audio_asset_key, lesson_guide_json, phrase_matches_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sentence.slug,
          sentence.maoriText,
          sentence.englishText,
          sentence.difficulty,
          sentence.category,
          sentence.sourceType,
          sentence.audioAssetKey ?? null,
          JSON.stringify(sentence.lessonGuide),
          JSON.stringify(sentence.phraseMatches),
        ],
      );
    }

    for (const vocab of vocabularyConceptSeeds) {
      await db.runAsync(
        `INSERT INTO vocabulary_concepts (
          concept_key, english_text, maori_text, english_helper, maori_helper, image_asset_key, audio_asset_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          vocab.conceptKey,
          vocab.englishText,
          vocab.maoriText,
          vocab.englishHelper ?? null,
          vocab.maoriHelper ?? null,
          vocab.imageAssetKey ?? null,
          vocab.audioAssetKey ?? null,
        ],
      );
    }

    for (const lesson of vocabularyLessonSeeds) {
      await db.runAsync(
        `INSERT INTO vocabulary_lessons (
          lesson_id, prompt, difficulty, answer_concept_key, options_language,
          source_language, source_text, transcript, option_count, category_override,
          use_answer_image, image_asset_key, audio_asset_key, lesson_guide_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lesson.lessonId,
          lesson.prompt,
          lesson.difficulty,
          lesson.answerConceptKey,
          lesson.optionsLanguage,
          lesson.sourceLanguage,
          lesson.sourceText ?? null,
          lesson.transcript ?? null,
          lesson.optionCount ?? null,
          lesson.categoryOverride ?? null,
          lesson.useAnswerImage ? 1 : 0,
          lesson.imageAssetKey ?? null,
          lesson.audioAssetKey ?? null,
          JSON.stringify(lesson.lessonGuide),
        ],
      );
    }

    for (const lesson of wordOrderLessonSeeds) {
      await db.runAsync(
        `INSERT INTO word_order_lessons (
          lesson_id, prompt, source_text, source_language, tiles_json,
          correct_sequence_ids_json, phrase_matches_json, difficulty, category, lesson_guide_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lesson.lessonId,
          lesson.prompt,
          lesson.sourceText,
          lesson.sourceLanguage,
          JSON.stringify(lesson.tiles),
          JSON.stringify(lesson.correctSequenceIds),
          lesson.phraseMatches ? JSON.stringify(lesson.phraseMatches) : null,
          lesson.difficulty,
          lesson.category ?? null,
          lesson.lessonGuide ? JSON.stringify(lesson.lessonGuide) : null,
        ],
      );
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`,
      [APP_META_KEY, String(SCHEMA_VERSION)],
    );
  });
};

/**
 * Ensures schema + starter content exist on device before lesson screens use data.
 */
export const initializeLessonDatabase = async () => {
  try {
    const db = await openDatabase();
    await createSchema(db);
    await seedIfNeeded(db);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize lesson SQLite database', error);
  }
};

export interface TemplateRecord {
  slug: string;
  title: string;
  maoriPattern: string;
  englishPattern: string;
  difficulty: DifficultyTag;
  category: QuestionCategory;
  lessonGuide: string[];
}

export const getTemplateRecords = async (): Promise<TemplateRecord[]> => {
  const db = await openDatabase();
  const rows = await db.getAllAsync<{
    slug: string;
    title: string;
    maori_pattern: string;
    english_pattern: string;
    difficulty: DifficultyTag;
    category: QuestionCategory;
    lesson_guide_json: string;
  }>('SELECT * FROM templates ORDER BY id ASC');

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    maoriPattern: row.maori_pattern,
    englishPattern: row.english_pattern,
    difficulty: row.difficulty,
    category: row.category,
    lessonGuide: JSON.parse(row.lesson_guide_json) as string[],
  }));
};

export interface ComplexSentenceRecord {
  slug: string;
  maoriText: string;
  englishText: string;
  difficulty: DifficultyTag;
  category: QuestionCategory;
  sourceType: 'template' | 'authored';
  audioAssetKey?: string;
  lessonGuide: string[];
  phraseMatches: { source: string; target: string }[];
}

export interface VocabularyConceptRecord {
  conceptKey: string;
  englishText: string;
  maoriText: string;
  englishHelper?: string;
  maoriHelper?: string;
  imageAssetKey?: string;
  audioAssetKey?: string;
}

export interface VocabularyLessonRecord {
  lessonId: string;
  prompt: string;
  difficulty: DifficultyTag;
  answerConceptKey: string;
  optionsLanguage: 'maori' | 'english';
  sourceLanguage: 'maori' | 'english';
  sourceText?: string;
  transcript?: string;
  optionCount?: number;
  categoryOverride?: QuestionCategory;
  useAnswerImage: boolean;
  imageAssetKey?: string;
  audioAssetKey?: string;
  lessonGuide: string[];
}

export interface WordOrderLessonRecord {
  lessonId: string;
  prompt: string;
  sourceText: string;
  sourceLanguage: 'maori' | 'english';
  tiles: { id: string; value: string }[];
  correctSequenceIds: string[];
  phraseMatches?: { source: string; target: string }[];
  difficulty: DifficultyTag;
  category?: QuestionCategory;
  lessonGuide?: string[];
}

export const getVocabularyConceptRecords = async (): Promise<VocabularyConceptRecord[]> => {
  const db = await openDatabase();
  const rows = await db.getAllAsync<{
    concept_key: string;
    english_text: string;
    maori_text: string;
    english_helper: string | null;
    maori_helper: string | null;
    image_asset_key: string | null;
    audio_asset_key: string | null;
  }>('SELECT * FROM vocabulary_concepts ORDER BY id ASC');

  return rows.map((row) => ({
    conceptKey: row.concept_key,
    englishText: row.english_text,
    maoriText: row.maori_text,
    englishHelper: row.english_helper ?? undefined,
    maoriHelper: row.maori_helper ?? undefined,
    imageAssetKey: row.image_asset_key ?? undefined,
    audioAssetKey: row.audio_asset_key ?? undefined,
  }));
};

export const getVocabularyLessonRecords = async (): Promise<VocabularyLessonRecord[]> => {
  const db = await openDatabase();
  const rows = await db.getAllAsync<{
    lesson_id: string;
    prompt: string;
    difficulty: DifficultyTag;
    answer_concept_key: string;
    options_language: 'maori' | 'english';
    source_language: 'maori' | 'english';
    source_text: string | null;
    transcript: string | null;
    option_count: number | null;
    category_override: QuestionCategory | null;
    use_answer_image: number;
    image_asset_key: string | null;
    audio_asset_key: string | null;
    lesson_guide_json: string;
  }>('SELECT * FROM vocabulary_lessons ORDER BY id ASC');

  return rows.map((row) => ({
    lessonId: row.lesson_id,
    prompt: row.prompt,
    difficulty: row.difficulty,
    answerConceptKey: row.answer_concept_key,
    optionsLanguage: row.options_language,
    sourceLanguage: row.source_language,
    sourceText: row.source_text ?? undefined,
    transcript: row.transcript ?? undefined,
    optionCount: row.option_count ?? undefined,
    categoryOverride: row.category_override ?? undefined,
    useAnswerImage: row.use_answer_image === 1,
    imageAssetKey: row.image_asset_key ?? undefined,
    audioAssetKey: row.audio_asset_key ?? undefined,
    lessonGuide: JSON.parse(row.lesson_guide_json) as string[],
  }));
};

export const getWordOrderLessonRecords = async (): Promise<WordOrderLessonRecord[]> => {
  const db = await openDatabase();
  const rows = await db.getAllAsync<{
    lesson_id: string;
    prompt: string;
    source_text: string;
    source_language: 'maori' | 'english';
    tiles_json: string;
    correct_sequence_ids_json: string;
    phrase_matches_json: string | null;
    difficulty: DifficultyTag;
    category: QuestionCategory | null;
    lesson_guide_json: string | null;
  }>('SELECT * FROM word_order_lessons ORDER BY id ASC');

  return rows.map((row) => ({
    lessonId: row.lesson_id,
    prompt: row.prompt,
    sourceText: row.source_text,
    sourceLanguage: row.source_language,
    tiles: JSON.parse(row.tiles_json) as { id: string; value: string }[],
    correctSequenceIds: JSON.parse(row.correct_sequence_ids_json) as string[],
    phraseMatches: row.phrase_matches_json
      ? (JSON.parse(row.phrase_matches_json) as { source: string; target: string }[])
      : undefined,
    difficulty: row.difficulty,
    category: row.category ?? undefined,
    lessonGuide: row.lesson_guide_json
      ? (JSON.parse(row.lesson_guide_json) as string[])
      : undefined,
  }));
};

export const getComplexSentenceRecords = async (): Promise<ComplexSentenceRecord[]> => {
  const db = await openDatabase();
  const rows = await db.getAllAsync<{
    slug: string;
    maori_text: string;
    english_text: string;
    difficulty: DifficultyTag;
    category: QuestionCategory;
    source_type: 'template' | 'authored';
    audio_asset_key: string | null;
    lesson_guide_json: string;
    phrase_matches_json: string;
  }>('SELECT * FROM complex_sentences ORDER BY id ASC');

  return rows.map((row) => ({
    slug: row.slug,
    maoriText: row.maori_text,
    englishText: row.english_text,
    difficulty: row.difficulty,
    category: row.category,
    sourceType: row.source_type,
    audioAssetKey: row.audio_asset_key ?? undefined,
    lessonGuide: JSON.parse(row.lesson_guide_json) as string[],
    phraseMatches: JSON.parse(row.phrase_matches_json) as { source: string; target: string }[],
  }));
};
