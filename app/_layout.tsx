import { TekkenTheme as T } from "@/constants/theme";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

const tekkenNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: T.background,
    card: T.card,
    text: T.text,
    border: T.border,
    primary: T.primary,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={tekkenNavTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="partida"
          options={{
            title: "Detalhes",
            headerStyle: { backgroundColor: T.background },
            headerTintColor: T.text,
            headerShadowVisible: false,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
