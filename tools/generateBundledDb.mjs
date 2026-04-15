import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const outputDir = path.resolve(process.cwd(), 'assets', 'database');
const outputPath = path.join(outputDir, 'ngakupu_lessons.db');

const SCHEMA_VERSION = 6;

const audioSeeds = [
  {
    assetKey: 'audio.whetu.local',
    transcript: 'Whetū',
    localPath: 'assets/audio/whetu.mp3',
    remoteUri: null,
  },
  {
    assetKey: 'audio.enoho.local',
    transcript: 'E noho rā',
    localPath: 'assets/audio/e-noho-ra.mp3',
    remoteUri: null,
  },
];

const templateSeeds = [
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

const complexSentenceSeeds = [
  {
    slug: 'ducks-forest',
    maoriText: 'Ngā rakiraki i haere ki te ngahere.',
    englishText: 'The ducks went to the forest.',
    difficulty: 'tamariki',
    category: 'written-comprehension',
    sourceType: 'authored',
    audioAssetKey: null,
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
    audioAssetKey: null,
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
    audioAssetKey: null,
    lessonGuide: ['Kei te + verb marks ongoing action.', 'I te whare = in the house.'],
    phraseMatches: [
      { source: 'Kei te moe', target: 'is sleeping' },
      { source: 'te ngeru', target: 'the cat' },
      { source: 'i te whare', target: 'in the house' },
    ],
  },
  {
    slug: 'whetu-audio',
    maoriText: 'Whetū',
    englishText: 'Star',
    difficulty: 'tamariki',
    category: 'listening-vocabulary',
    sourceType: 'authored',
    audioAssetKey: 'audio.whetu.local',
    lessonGuide: ['Whakarongo ki te kupu.', 'Whetū = star.'],
    phraseMatches: [{ source: 'Whetū', target: 'Star' }],
  },
];

const vocabularyConceptSeeds = [
  {
    conceptKey: 'octopus',
    englishText: 'Octopus',
    maoriText: 'Wheke',
    englishHelper: null,
    maoriHelper: null,
    imageAssetKey: 'image.octopus.local',
    audioAssetKey: null,
  },
  {
    conceptKey: 'star',
    englishText: 'Star',
    maoriText: 'Whetū',
    englishHelper: null,
    maoriHelper: null,
    imageAssetKey: 'image.star.local',
    audioAssetKey: 'audio.whetu.local',
  },
  {
    conceptKey: 'cat',
    englishText: 'Cat',
    maoriText: 'Ngeru',
    englishHelper: null,
    maoriHelper: null,
    imageAssetKey: 'image.cat.local',
    audioAssetKey: null,
  },
  {
    conceptKey: 'bird',
    englishText: 'Bird',
    maoriText: 'Manu',
    englishHelper: null,
    maoriHelper: null,
    imageAssetKey: 'image.bird.remote',
    audioAssetKey: null,
  },
  {
    conceptKey: 'farewell',
    englishText: 'Goodbye (To someone staying)',
    maoriText: 'E noho rā',
    englishHelper: null,
    maoriHelper: null,
    imageAssetKey: 'image.farewell.remote',
    audioAssetKey: 'audio.enoho.local',
  },
  {
    conceptKey: 'greeting',
    englishText: 'Hello',
    maoriText: 'Kia ora',
    englishHelper: null,
    maoriHelper: null,
    imageAssetKey: 'image.greeting.remote',
    audioAssetKey: null,
  },
];

const vocabularyLessonSeeds = [
  {
    lessonId: 'lesson-octopus',
    prompt: 'He aha tēnei kararehe?',
    difficulty: 'tamariki',
    answerConceptKey: 'octopus',
    optionsLanguage: 'maori',
    sourceLanguage: 'english',
    sourceText: 'Octopus',
    transcript: null,
    optionCount: 3,
    categoryOverride: null,
    useAnswerImage: 1,
    imageAssetKey: null,
    audioAssetKey: null,
    lessonGuide: ['He aha... ? = What is...?', 'Choose the kupu that matches the image.'],
  },
  {
    lessonId: 'lesson-whetu-audio',
    prompt: 'Whakarongo ki te kupu ka kōwhiri i te whakamāoritanga tika.',
    difficulty: 'tamariki',
    answerConceptKey: 'star',
    optionsLanguage: 'english',
    sourceLanguage: 'maori',
    sourceText: null,
    transcript: 'Whetū',
    optionCount: 3,
    categoryOverride: null,
    useAnswerImage: 0,
    imageAssetKey: null,
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
    sourceText: null,
    transcript: 'E noho rā',
    optionCount: 3,
    categoryOverride: null,
    useAnswerImage: 0,
    imageAssetKey: null,
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
    transcript: null,
    optionCount: 3,
    categoryOverride: null,
    useAnswerImage: 1,
    imageAssetKey: null,
    audioAssetKey: null,
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
    transcript: null,
    optionCount: 4,
    categoryOverride: null,
    useAnswerImage: 0,
    imageAssetKey: null,
    audioAssetKey: null,
    lessonGuide: ['Kia ora = Hello / thanks / well-being greeting.'],
  },
];

const wordOrderLessonSeeds = [
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

const SQL = await initSqlJs({});
const db = new SQL.Database();

const exec = (sql) => db.exec(sql);
const run = (sql, params) => db.run(sql, params);

exec(`
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audio_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_key TEXT UNIQUE NOT NULL,
  transcript TEXT NOT NULL,
  local_path TEXT,
  remote_uri TEXT
);
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  maori_pattern TEXT NOT NULL,
  english_pattern TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  category TEXT NOT NULL,
  lesson_guide_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS complex_sentences (
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
);
CREATE TABLE IF NOT EXISTS vocabulary_concepts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  concept_key TEXT UNIQUE NOT NULL,
  english_text TEXT NOT NULL,
  maori_text TEXT NOT NULL,
  english_helper TEXT,
  maori_helper TEXT,
  image_asset_key TEXT,
  audio_asset_key TEXT,
  FOREIGN KEY (audio_asset_key) REFERENCES audio_assets(asset_key)
);
CREATE TABLE IF NOT EXISTS vocabulary_lessons (
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
);
CREATE TABLE IF NOT EXISTS word_order_lessons (
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
);
`);

for (const audio of audioSeeds) {
  run(
    `INSERT INTO audio_assets (asset_key, transcript, local_path, remote_uri) VALUES (?, ?, ?, ?)`,
    [audio.assetKey, audio.transcript, audio.localPath, audio.remoteUri],
  );
}

for (const template of templateSeeds) {
  run(
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
  run(
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
      sentence.audioAssetKey,
      JSON.stringify(sentence.lessonGuide),
      JSON.stringify(sentence.phraseMatches),
    ],
  );
}

for (const vocab of vocabularyConceptSeeds) {
  run(
    `INSERT INTO vocabulary_concepts (
      concept_key, english_text, maori_text, english_helper, maori_helper, image_asset_key, audio_asset_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      vocab.conceptKey,
      vocab.englishText,
      vocab.maoriText,
      vocab.englishHelper,
      vocab.maoriHelper,
      vocab.imageAssetKey,
      vocab.audioAssetKey,
    ],
  );
}

for (const lesson of vocabularyLessonSeeds) {
  run(
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
      lesson.sourceText,
      lesson.transcript,
      lesson.optionCount,
      lesson.categoryOverride,
      lesson.useAnswerImage,
      lesson.imageAssetKey,
      lesson.audioAssetKey,
      JSON.stringify(lesson.lessonGuide),
    ],
  );
}

for (const lesson of wordOrderLessonSeeds) {
  run(
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
      lesson.category,
      lesson.lessonGuide ? JSON.stringify(lesson.lessonGuide) : null,
    ],
  );
}

run(`INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`, [
  'schema_version',
  String(SCHEMA_VERSION),
]);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(outputPath, Buffer.from(db.export()));
db.close();

console.log(`Bundled DB generated: ${outputPath}`);
