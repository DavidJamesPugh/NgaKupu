import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

const cwd = process.cwd();
const dbPath = path.resolve(cwd, 'assets', 'database', 'ngakupu_lessons.db');
const registryConfigPath = path.resolve(cwd, 'src', 'data', 'db', 'assetRegistry.config.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const getColumnValues = (db, sql) => {
  const result = db.exec(sql);
  if (!result.length) {
    return [];
  }
  return result[0].values.map((row) => row[0]).filter(Boolean);
};

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const isSingleWord = (text) => countWords(text) <= 1;

const fail = (message) => {
  throw new Error(message);
};

const assertAllDbKeysExistInRegistry = (db, config) => {
  const registryImageKeys = new Set(Object.keys(config.images ?? {}));
  const registryAudioKeys = new Set(Object.keys(config.audio ?? {}));

  const dbImageKeys = getColumnValues(
    db,
    `SELECT DISTINCT image_asset_key FROM vocabulary_concepts WHERE image_asset_key IS NOT NULL`,
  );
  const dbAudioKeys = getColumnValues(
    db,
    `SELECT DISTINCT audio_asset_key FROM vocabulary_concepts WHERE audio_asset_key IS NOT NULL
     UNION
     SELECT DISTINCT audio_asset_key FROM complex_sentences WHERE audio_asset_key IS NOT NULL`,
  );

  const missingImages = dbImageKeys.filter((key) => !registryImageKeys.has(key));
  const missingAudio = dbAudioKeys.filter((key) => !registryAudioKeys.has(key));

  if (missingImages.length) {
    fail(`Missing image keys in asset registry config: ${missingImages.join(', ')}`);
  }
  if (missingAudio.length) {
    fail(`Missing audio keys in asset registry config: ${missingAudio.join(', ')}`);
  }
};

const assertConceptsHaveBothLanguages = (db) => {
  const result = db.exec(
    `SELECT concept_key, english_text, maori_text FROM vocabulary_concepts ORDER BY concept_key ASC`,
  );
  if (!result.length) {
    return;
  }

  const invalidConcepts = [];
  for (const row of result[0].values) {
    const concept = String(row[0]);
    const english = String(row[1] ?? '').trim();
    const maori = String(row[2] ?? '').trim();
    if (!english || !maori) {
      invalidConcepts.push(concept);
    }
  }

  if (invalidConcepts.length) {
    fail(`Concepts missing bilingual text: ${invalidConcepts.join('; ')}`);
  }
};

const assertVocabularyLessonsLinkValidAnswers = (db) => {
  const result = db.exec(
    `SELECT lesson_id, answer_concept_key
     FROM vocabulary_lessons
     WHERE answer_concept_key NOT IN (SELECT concept_key FROM vocabulary_concepts)`,
  );
  if (!result.length || result[0].values.length === 0) {
    return;
  }
  const invalid = result[0].values.map((row) => `${row[0]} -> ${row[1]}`);
  fail(`Vocabulary lessons reference missing answer entries: ${invalid.join('; ')}`);
};

const assertSentenceDistractorShapePool = (db) => {
  const result = db.exec(`SELECT slug, english_text FROM complex_sentences ORDER BY id ASC`);
  if (!result.length) {
    return;
  }

  const rows = result[0].values.map((row) => ({
    slug: String(row[0]),
    englishText: String(row[1]),
  }));

  const failures = [];
  for (const row of rows) {
    if (isSingleWord(row.englishText)) {
      continue;
    }
    const shapedDistractors = rows.filter(
      (candidate) =>
        candidate.slug !== row.slug && !isSingleWord(candidate.englishText),
    );
    if (shapedDistractors.length < 2) {
      failures.push(
        `${row.slug} has only ${shapedDistractors.length} sentence-shaped distractors`,
      );
    }
  }

  if (failures.length) {
    fail(`Sentence distractor shape validation failed: ${failures.join('; ')}`);
  }
};

const main = async () => {
  const config = readJson(registryConfigPath);
  const SQL = await initSqlJs({});
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    assertAllDbKeysExistInRegistry(db, config);
    assertConceptsHaveBothLanguages(db);
    assertVocabularyLessonsLinkValidAnswers(db);
    assertSentenceDistractorShapePool(db);
  } finally {
    db.close();
  }

  console.log('Lesson data validation passed.');
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
