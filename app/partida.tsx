import { Redirect } from "expo-router";

// This screen is no longer used — winner selection is now inline in the Partidas tab.
export default function PartidaRedirect() {
  return <Redirect href="/(tabs)/partidas" />;
}
