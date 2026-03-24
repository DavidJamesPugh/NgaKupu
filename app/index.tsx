import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createQuestionSet } from '../src/data/sampleQuestions';
import type { Question } from '../src/types/Question';
import { colors } from '../src/theme/colors';

const difficultyDescriptions: Record<string, string> = {
  tamariki: 'Friendly introductions for tamariki with simple kupu pairs.',
  tauira: 'Extend your reo with everyday sentences and translations.',
  tohunga: 'Challenge yourself with advanced rerenga kōrero (coming soon).',
};

const titleMap: Record<string, string> = {
  tamariki: 'Tamariki',
  tauira: 'Tauira',
  tohunga: 'Tohunga',
};

const getDifficultyTitle = (key: Difficulty) =>
  titleMap[key as keyof typeof titleMap] ?? key;

const getDifficultyDescription = (key: Difficulty) =>
  difficultyDescriptions[key as keyof typeof difficultyDescriptions] ??
  'Practise the kupu and rerenga kōrero for this level.';

type Difficulty = NonNullable<Question['difficulty']>;
const difficultyOrder: Difficulty[] = ['tamariki', 'tauira', 'tohunga'];

type Category = Question['category'];
const categoryOrder: Category[] = [
  'written-vocabulary',
  'listening-vocabulary',
  'written-comprehension',
  'listening-comprehension',
];

const categoryLabels: Record<Category, string> = {
  'written-vocabulary': 'Written Vocabulary',
  'listening-vocabulary': 'Listening Vocabulary',
  'written-comprehension': 'Written Comprehension',
  'listening-comprehension': 'Listening Comprehension',
};

const categoryDescriptions: Record<Category, string> = {
  'written-vocabulary': 'Quick word recall with text prompts.',
  'listening-vocabulary': 'Hear kupu Māori and match the meaning.',
  'written-comprehension': 'Translate full sentences to reinforce structure.',
  'listening-comprehension': 'Understand spoken phrases and select the response.',
};

const Index = () => {
  const questionSet = useMemo<Question[]>(() => createQuestionSet(), []);

  const availableDifficulties = useMemo<Difficulty[]>(() => {
    const present = new Set<Difficulty>();
    questionSet.forEach((question) => {
      if (question.difficulty) {
        present.add(question.difficulty);
      }
    });

    const ordered = difficultyOrder.filter((item) => present.has(item));
    const extras = Array.from(present).filter(
      (item) => !difficultyOrder.includes(item),
    );

    return [...ordered, ...extras];
  }, [questionSet]);

  const availableCategories = useMemo<Category[]>(() => {
    const present = new Set<Category>();
    questionSet.forEach((question) => {
      present.add(question.category);
    });

    const ordered = categoryOrder.filter((item) => present.has(item));
    const extras = Array.from(present).filter(
      (item) => !categoryOrder.includes(item),
    );

    return [...ordered, ...extras];
  }, [questionSet]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.cardGrid}>
          <Link href="/practice" asChild>
            <Pressable style={styles.cardAll}>
              <Text style={styles.cardTitleAlt}>All Questions</Text>
              <Text style={styles.cardBodyAlt}>
                Jump into mixed exercises across every level.
              </Text>
            </Pressable>
          </Link>
        </View>

        <Text style={styles.sectionTitle}>Difficulties</Text>
        <View style={styles.cardGrid}>
          {availableDifficulties.map((difficulty) => (
            <Link
              key={difficulty}
              href={{
                pathname: '/practice',
                params: { difficulty },
              }}
              asChild
            >
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{getDifficultyTitle(difficulty)}</Text>
                <Text style={styles.cardBody}>{getDifficultyDescription(difficulty)}</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.cardGrid}>
          {availableCategories.map((category) => (
            <Link
              key={category}
              href={{
                pathname: '/practice',
                params: { category },
              }}
              asChild
            >
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{categoryLabels[category]}</Text>
                <Text style={styles.cardBody}>{categoryDescriptions[category]}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
    backgroundColor: colors.background,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  subheading: {
    fontSize: 18,
    color: colors.mutedText,
    lineHeight: 26,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    width: '46%',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  cardAll: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    width: '100%',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
  },
  cardBody: {
    fontSize: 16,
    color: colors.mutedText,
    lineHeight: 24,
  },
  cardTitleAlt: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.background,
  },
  cardBodyAlt: {
    fontSize: 16,
    color: '#eef2ff',
    lineHeight: 24,
  },
  cardAction: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  cardActionAlt: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});
