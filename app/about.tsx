import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heading}>Ngā Kupu</Text>
          <Text style={styles.paragraph}>
            Ngā Kupu is a learning companion for practising Te Reo Māori sentences
            through short, focused exercises. As the project grows we will add
            richer pathways, audio prompts, and spaced repetition to support everyday
            reo Māori use.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Whāinga | Mission</Text>
          <Text style={styles.paragraph}>
            Empower learners with quick practice sessions that combine kupu,
            sentence patterns, and listening comprehension. Designed for mobile
            learning on-the-go.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 20,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.background,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#e0e7ff',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
});
