import {
  FontSize,
  Radius,
  Shadows,
  Spacing,
  TekkenTheme as T,
} from "@/constants/theme";
import {
  fetchTorneios,
  healthCheck,
  Torneio,
} from "@/services/api";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const [health, t] = await Promise.all([
        healthCheck().then(() => true).catch(() => false),
        fetchTorneios().catch(() => [] as Torneio[]),
      ]);
      setApiOnline(health);
      setTorneios(t);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>TEKKEN 8</Text>
        <Text style={styles.headerTitle}>TORNEIO</Text>
        <View style={styles.headerLine} />
      </View>

      {/* Health Check — GET / */}
      <View style={[styles.healthCard, apiOnline ? styles.healthOnline : styles.healthOffline]}>
        <MaterialIcons
          name={apiOnline ? "check-circle" : "error"}
          size={28}
          color={apiOnline ? T.success : T.danger}
        />
        <View style={styles.healthBody}>
          <Text style={styles.healthLabel}>Status da API</Text>
          <Text style={styles.healthHint}>GET /</Text>
          <Text style={[styles.healthValue, { color: apiOnline ? T.success : T.danger }]}>
            {apiOnline ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialIcons name="emoji-events" size={24} color={T.secondary} />
          <Text style={[styles.statValue, { color: T.secondary }]}>{torneios.length}</Text>
          <Text style={styles.statLabel}>TORNEIOS</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="sports-esports" size={24} color={T.primary} />
          <Text style={[styles.statValue, { color: T.primary }]}>
            {torneios.filter((t) => new Date(t.data_final) >= new Date()).length}
          </Text>
          <Text style={styles.statLabel}>ATIVOS</Text>
        </View>
      </View>

      {/* Torneios recentes — GET /torneios */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>TORNEIOS RECENTES</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/torneios" as any)}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {torneios.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="info-outline" size={32} color={T.textMuted} />
            <Text style={styles.emptyText}>Nenhum torneio cadastrado</Text>
          </View>
        ) : (
          torneios.slice(0, 5).map((torneio) => (
            <TouchableOpacity
              key={torneio.id}
              style={styles.torneioCard}
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/torneios" as any)}
            >
              <View style={styles.torneioHeader}>
                <MaterialIcons name="emoji-events" size={20} color={T.secondary} />
                <Text style={styles.torneioTitle}>{torneio.titulo}</Text>
              </View>
              <View style={styles.torneioInfo}>
                <View style={styles.torneioInfoItem}>
                  <MaterialIcons name="calendar-today" size={14} color={T.textMuted} />
                  <Text style={styles.torneioInfoText}>
                    {new Date(torneio.data_inicio).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
                <View style={styles.torneioInfoItem}>
                  <MaterialIcons name="paid" size={14} color={T.secondary} />
                  <Text style={[styles.torneioInfoText, { color: T.secondary }]}>
                    R$ {torneio.premio.toLocaleString("pt-BR")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Fluxo do Torneio */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>FLUXO DO TORNEIO</Text>
        {[
          { icon: "sports-martial-arts" as const, label: "1. Cadastrar Personagens", hint: "POST /personagens-multiplos" },
          { icon: "person-add" as const, label: "2. Cadastrar Participantes", hint: "POST /participantes" },
          { icon: "emoji-events" as const, label: "3. Criar Torneio", hint: "POST /torneios" },
          { icon: "account-tree" as const, label: "4. Gerar Bracket", hint: "POST /torneios/:id/gerar-bracket" },
          { icon: "sports-esports" as const, label: "5. Consultar Partidas", hint: "GET /torneios/:id/partidas" },
          { icon: "military-tech" as const, label: "6. Definir Vencedores", hint: "PATCH /rounds/:id/vencedor" },
        ].map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepIconWrap}>
              <MaterialIcons name={step.icon} size={20} color={T.primary} />
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <Text style={styles.stepHint}>{step.hint}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Acesso Rapido */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACESSO RAPIDO</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/cadastro")}>
            <MaterialIcons name="person-add" size={28} color={T.success} />
            <Text style={styles.actionLabel}>Cadastro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/torneios" as any)}>
            <MaterialIcons name="emoji-events" size={28} color={T.secondary} />
            <Text style={styles.actionLabel}>Torneios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/partidas")}>
            <MaterialIcons name="sports-esports" size={28} color={T.primary} />
            <Text style={styles.actionLabel}>Partidas</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.background },
  content: { paddingHorizontal: Spacing.md, paddingTop: 60 },
  center: { justifyContent: "center", alignItems: "center" },

  // Header
  header: { alignItems: "center", marginBottom: Spacing.xl },
  headerSubtitle: { fontSize: FontSize.sm, color: T.primary, letterSpacing: 6, fontWeight: "700" },
  headerTitle: { fontSize: FontSize.hero, fontWeight: "900", color: T.text, letterSpacing: 4, marginTop: Spacing.xs },
  headerLine: { width: 60, height: 3, backgroundColor: T.primary, marginTop: Spacing.md, borderRadius: 2 },

  // Health Check
  healthCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  healthOnline: { borderLeftColor: T.success },
  healthOffline: { borderLeftColor: T.danger },
  healthBody: { marginLeft: Spacing.md },
  healthLabel: { color: T.textSecondary, fontSize: FontSize.sm, fontWeight: "600" },
  healthHint: { color: T.textMuted, fontSize: FontSize.xs, fontFamily: "monospace" },
  healthValue: { fontSize: FontSize.lg, fontWeight: "700", marginTop: Spacing.xs },

  // Stats
  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: T.border,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: "900" },
  statLabel: { fontSize: FontSize.xs, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 },

  // Section
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xs },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: "700", color: T.textMuted, letterSpacing: 2, marginBottom: Spacing.md },
  seeAll: { fontSize: FontSize.md, color: T.primary, fontWeight: "600", marginBottom: Spacing.md },
  endpointHint: { color: T.textMuted, fontSize: FontSize.xs, fontFamily: "monospace", marginBottom: Spacing.md },

  // Torneio cards
  torneioCard: {
    backgroundColor: T.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: T.border,
  },
  torneioHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  torneioTitle: { fontSize: FontSize.base, fontWeight: "700", color: T.text, flex: 1 },
  torneioInfo: { flexDirection: "row", justifyContent: "space-between" },
  torneioInfoItem: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  torneioInfoText: { fontSize: FontSize.sm, color: T.textSecondary },

  // Empty
  emptyCard: { backgroundColor: T.card, borderRadius: Radius.md, padding: Spacing.xl, alignItems: "center" },
  emptyText: { color: T.textMuted, fontSize: FontSize.md, marginTop: Spacing.sm },

  // Steps
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.card,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: T.border,
    gap: Spacing.md,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  stepBody: { flex: 1 },
  stepLabel: { color: T.text, fontSize: FontSize.md, fontWeight: "600" },
  stepHint: { color: T.textMuted, fontSize: FontSize.xs, fontFamily: "monospace" },

  // Actions
  actionsRow: { flexDirection: "row", gap: Spacing.sm },
  actionCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: T.border,
  },
  actionLabel: { fontSize: FontSize.sm, color: T.textSecondary, fontWeight: "600" },
});
