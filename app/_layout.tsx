import { Stack } from 'expo-router';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontSize: 18, fontWeight: '600', color: colors.primary },
        headerTintColor: colors.accent,
        headerShadowVisible: false,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '',
          headerBackVisible: false,
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="practice"
        options={{
          title: 'Practice',
          headerBackTitle: 'Home',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'About',
          headerBackTitle: 'Home',
        }}
      />
    </Stack>
  );
}
