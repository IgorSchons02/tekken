import { StyleSheet, Text, View } from "react-native";

const statusConfig = {
  aguardando: {
    label: "Aguardando",
    color: "#856404",
    bg: "#fff3cd",
  },
  em_andamento: {
    label: "Em Andamento",
    color: "#004085",
    bg: "#cce5ff",
  },
  finalizado: {
    label: "Finalizado",
    color: "#155724",
    bg: "#d4edda",
  },

  default: {
    label: "Pendente",
    color: "#383d41",
    bg: "#e2e3e5",
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.default;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  text: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
