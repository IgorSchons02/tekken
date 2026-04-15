import { FontSize, Radius, Spacing, TekkenTheme as T } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente: {
    label: "Pendente",
    color: T.warning,
    bg: T.warning + "20",
  },
  aguardando: {
    label: "Aguardando",
    color: T.warning,
    bg: T.warning + "20",
  },
  em_andamento: {
    label: "Ao Vivo",
    color: T.info,
    bg: T.info + "20",
  },
  finalizado: {
    label: "Finalizado",
    color: T.success,
    bg: T.success + "20",
  },
  concluido: {
    label: "Finalizado",
    color: T.success,
    bg: T.success + "20",
  },
  default: {
    label: "Pendente",
    color: T.textMuted,
    bg: T.textMuted + "20",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.default;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
